'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { searchAddresses, type AddressSuggestion } from '@/libs/GoogleMapsService';
import { useCourtData, type TennisCourt } from '@/hooks/useCourtData';
import GoogleMap from './GoogleMap';
import GoogleMapMarker from './GoogleMapMarker';

interface MeetInTheMiddleProps {
  onCourtSelect: (court: TennisCourt) => void;
}

interface AddressInput {
  query: string;
  selected: AddressSuggestion | null;
  suggestions: AddressSuggestion[];
  showSuggestions: boolean;
  isSearching: boolean;
}

interface CourtWithDistances extends TennisCourt {
  distanceFromAddress1: number;
  distanceFromAddress2: number;
  drivingTimeFromAddress1?: string;
  drivingTimeFromAddress2?: string;
}

export default function MeetInTheMiddle({ onCourtSelect }: MeetInTheMiddleProps) {
  const { courts } = useCourtData();
  const [address1, setAddress1] = useState<AddressInput>({
    query: '',
    selected: null,
    suggestions: [],
    showSuggestions: false,
    isSearching: false,
  });
  const [address2, setAddress2] = useState<AddressInput>({
    query: '',
    selected: null,
    suggestions: [],
    showSuggestions: false,
    isSearching: false,
  });
  const [filteredCourts, setFilteredCourts] = useState<CourtWithDistances[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState<CourtWithDistances | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 41.8781, lng: -87.6298 }); // Chicago center

  const address1InputRef = useRef<HTMLInputElement>(null);
  const address2InputRef = useRef<HTMLInputElement>(null);
  const suggestions1Ref = useRef<HTMLDivElement>(null);
  const suggestions2Ref = useRef<HTMLDivElement>(null);
  const searchTimeout1Ref = useRef<NodeJS.Timeout | null>(null);
  const searchTimeout2Ref = useRef<NodeJS.Timeout | null>(null);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
      + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
      * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Check if a court is between two addresses
  const isCourtBetween = useCallback((court: TennisCourt, addr1: AddressSuggestion, addr2: AddressSuggestion): boolean => {
    const distanceAddr1ToCourt = calculateDistance(addr1.lat, addr1.lon, court.latitude, court.longitude);
    const distanceAddr2ToCourt = calculateDistance(addr2.lat, addr2.lon, court.latitude, court.longitude);
    const distanceAddr1ToAddr2 = calculateDistance(addr1.lat, addr1.lon, addr2.lat, addr2.lon);

    // Court is considered "between" if the sum of distances to both addresses
    // is not significantly more than the direct distance between addresses
    // Allow up to 50% overhead for routing flexibility
    const totalDistanceViaCourt = distanceAddr1ToCourt + distanceAddr2ToCourt;
    return totalDistanceViaCourt <= distanceAddr1ToAddr2 * 1.5;
  }, [calculateDistance]);

  // Get driving distances using modern Routes API
  const getDrivingDistances = useCallback(async (courts: CourtWithDistances[], addr1: AddressSuggestion, addr2: AddressSuggestion) => {
    if (courts.length === 0) return courts;

    try {
      const updatedCourts = [...courts];
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        console.error('Google Maps API key not found');
        return courts;
      }

      // Process courts in smaller batches to avoid rate limiting
      const batchSize = 3;
      for (let i = 0; i < courts.length; i += batchSize) {
        const batch = courts.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (court, batchIndex) => {
            const courtIndex = i + batchIndex;
            
            try {
              // Get driving time from address 1 to court using Routes API
              const route1Response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Goog-Api-Key': apiKey,
                  'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters'
                },
                body: JSON.stringify({
                  origin: {
                    location: {
                      latLng: {
                        latitude: addr1.lat,
                        longitude: addr1.lon
                      }
                    }
                  },
                  destination: {
                    location: {
                      latLng: {
                        latitude: court.latitude,
                        longitude: court.longitude
                      }
                    }
                  },
                  travelMode: 'DRIVE',
                  routingPreference: 'TRAFFIC_AWARE',
                  units: 'IMPERIAL'
                })
              });

              // Get driving time from address 2 to court using Routes API
              const route2Response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Goog-Api-Key': apiKey,
                  'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters'
                },
                body: JSON.stringify({
                  origin: {
                    location: {
                      latLng: {
                        latitude: addr2.lat,
                        longitude: addr2.lon
                      }
                    }
                  },
                  destination: {
                    location: {
                      latLng: {
                        latitude: court.latitude,
                        longitude: court.longitude
                      }
                    }
                  },
                  travelMode: 'DRIVE',
                  routingPreference: 'TRAFFIC_AWARE',
                  units: 'IMPERIAL'
                })
              });

              let drivingTimeFromAddress1: string | undefined;
              let drivingTimeFromAddress2: string | undefined;

              // Parse response from address 1
              if (route1Response.ok) {
                const route1Data = await route1Response.json();
                if (route1Data.routes && route1Data.routes.length > 0) {
                  const duration = route1Data.routes[0].duration;
                  if (duration) {
                    // Convert duration (e.g., "1234s") to readable format
                    const seconds = parseInt(duration.replace('s', ''));
                    const minutes = Math.round(seconds / 60);
                    drivingTimeFromAddress1 = minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} hr ${minutes % 60} min`;
                  }
                }
              }

              // Parse response from address 2
              if (route2Response.ok) {
                const route2Data = await route2Response.json();
                if (route2Data.routes && route2Data.routes.length > 0) {
                  const duration = route2Data.routes[0].duration;
                  if (duration) {
                    // Convert duration (e.g., "1234s") to readable format
                    const seconds = parseInt(duration.replace('s', ''));
                    const minutes = Math.round(seconds / 60);
                    drivingTimeFromAddress2 = minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} hr ${minutes % 60} min`;
                  }
                }
              }

              updatedCourts[courtIndex] = {
                ...court,
                drivingTimeFromAddress1,
                drivingTimeFromAddress2,
              };
            } catch (error) {
              console.error(`Error getting directions for court ${court.name}:`, error);
              // Keep the court without driving times
            }
          })
        );
        
        // Longer delay between batches for Routes API rate limits
        if (i + batchSize < courts.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      return updatedCourts;
    } catch (error) {
      console.error('Error getting driving distances:', error);
      return courts;
    }
  }, []);

  // Handle address search
  const handleAddressSearch = useCallback(async (
    searchTerm: string, 
    addressNumber: 1 | 2
  ) => {
    if (searchTerm.length < 3) {
      if (addressNumber === 1) {
        setAddress1(prev => ({ ...prev, suggestions: [], showSuggestions: false }));
      } else {
        setAddress2(prev => ({ ...prev, suggestions: [], showSuggestions: false }));
      }
      return;
    }

    const updateState = addressNumber === 1 ? setAddress1 : setAddress2;
    updateState(prev => ({ ...prev, isSearching: true }));

    try {
      const suggestions = await searchAddresses(searchTerm);
      updateState(prev => ({
        ...prev,
        suggestions,
        showSuggestions: suggestions.length > 0,
        isSearching: false,
      }));
    } catch (error) {
      console.error('Error searching addresses:', error);
      updateState(prev => ({
        ...prev,
        suggestions: [],
        showSuggestions: false,
        isSearching: false,
      }));
    }
  }, []);

  // Handle address input change
  const handleAddressInputChange = (value: string, addressNumber: 1 | 2) => {
    const updateState = addressNumber === 1 ? setAddress1 : setAddress2;
    const timeoutRef = addressNumber === 1 ? searchTimeout1Ref : searchTimeout2Ref;

    updateState(prev => ({ ...prev, query: value, selected: null }));

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      handleAddressSearch(value, addressNumber);
    }, 300);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: AddressSuggestion, addressNumber: 1 | 2) => {
    const updateState = addressNumber === 1 ? setAddress1 : setAddress2;
    updateState(prev => ({
      ...prev,
      query: suggestion.display_name,
      selected: suggestion,
      showSuggestions: false,
      suggestions: [],
    }));
  };

  // Find courts between addresses
  const findCourtsInBetween = useCallback(async () => {
    if (!address1.selected || !address2.selected) return;

    setIsCalculating(true);
    setSelectedCourt(null);

    try {
      // Filter courts that are geographically between the two addresses
      const betweenCourts = courts.filter(court => 
        isCourtBetween(court, address1.selected!, address2.selected!)
      );

      // Calculate distances
      const courtsWithDistances: CourtWithDistances[] = betweenCourts.map(court => ({
        ...court,
        distanceFromAddress1: calculateDistance(
          address1.selected!.lat, 
          address1.selected!.lon, 
          court.latitude, 
          court.longitude
        ),
        distanceFromAddress2: calculateDistance(
          address2.selected!.lat, 
          address2.selected!.lon, 
          court.latitude, 
          court.longitude
        ),
      }));

      // Sort by total distance from both addresses
      const sortedCourts = courtsWithDistances.sort((a, b) => 
        (a.distanceFromAddress1 + a.distanceFromAddress2) - 
        (b.distanceFromAddress1 + b.distanceFromAddress2)
      );

      // Get driving distances
      const courtsWithDrivingTimes = await getDrivingDistances(sortedCourts, address1.selected!, address2.selected!);

      setFilteredCourts(courtsWithDrivingTimes);

      // Update map center to midpoint between addresses
      const centerLat = (address1.selected!.lat + address2.selected!.lat) / 2;
      const centerLng = (address1.selected!.lon + address2.selected!.lon) / 2;
      setMapCenter({ lat: centerLat, lng: centerLng });

    } catch (error) {
      console.error('Error finding courts:', error);
    } finally {
      setIsCalculating(false);
    }
  }, [address1.selected, address2.selected, courts, isCourtBetween, calculateDistance, getDrivingDistances]);

  // Handle court selection
  const handleCourtClick = (court: CourtWithDistances) => {
    setSelectedCourt(court);
    onCourtSelect(court);
  };

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestions1Ref.current &&
        !suggestions1Ref.current.contains(event.target as Node) &&
        address1InputRef.current &&
        !address1InputRef.current.contains(event.target as Node)
      ) {
        setAddress1(prev => ({ ...prev, showSuggestions: false }));
      }
      if (
        suggestions2Ref.current &&
        !suggestions2Ref.current.contains(event.target as Node) &&
        address2InputRef.current &&
        !address2InputRef.current.contains(event.target as Node)
      ) {
        setAddress2(prev => ({ ...prev, showSuggestions: false }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (searchTimeout1Ref.current) clearTimeout(searchTimeout1Ref.current);
      if (searchTimeout2Ref.current) clearTimeout(searchTimeout2Ref.current);
    };
  }, []);

  return (
    <div className="h-full flex flex-col lg:flex-row bg-[#002C4D]">
      {/* Input Panel */}
      <div className="w-full lg:w-1/3 bg-[#011B2E] border-r border-[#27131D] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#27131D]">
          <h2 className="text-2xl font-bold text-[#EC0037] mb-2">Meet in the Middle</h2>
          <p className="text-[#BFC3C7] text-sm">
            Find tennis courts between two addresses that are convenient for both players.
          </p>
        </div>

        {/* Address Inputs */}
        <div className="p-6 space-y-6">
          {/* Address 1 */}
          <div className="relative">
            <label className="block text-[#FFFFFF] font-medium mb-2">
              First Address
            </label>
            <div className="relative">
              <input
                ref={address1InputRef}
                type="text"
                value={address1.query}
                onChange={(e) => handleAddressInputChange(e.target.value, 1)}
                placeholder="Enter first address..."
                className="w-full px-4 py-3 bg-[#002C4D] border border-[#BFC3C7] rounded-lg text-white placeholder-[#7F8B95] focus:ring-2 focus:ring-[#69F0FD] focus:border-[#69F0FD] transition-colors"
              />
              {address1.isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#69F0FD]"></div>
                </div>
              )}
            </div>
            
            {/* Address 1 Suggestions */}
            {address1.showSuggestions && address1.suggestions.length > 0 && (
              <div ref={suggestions1Ref} className="absolute z-50 w-full mt-1 bg-[#002C4D] border border-[#BFC3C7] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {address1.suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionSelect(suggestion, 1)}
                    className="w-full px-4 py-3 text-left hover:bg-[#011B2E] transition-colors border-b border-[#27131D] last:border-b-0"
                  >
                    <div className="text-white font-medium">{suggestion.address}</div>
                    <div className="text-[#BFC3C7] text-sm">{suggestion.city}, {suggestion.state} {suggestion.zip}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Address 2 */}
          <div className="relative">
            <label className="block text-[#FFFFFF] font-medium mb-2">
              Second Address
            </label>
            <div className="relative">
              <input
                ref={address2InputRef}
                type="text"
                value={address2.query}
                onChange={(e) => handleAddressInputChange(e.target.value, 2)}
                placeholder="Enter second address..."
                className="w-full px-4 py-3 bg-[#002C4D] border border-[#BFC3C7] rounded-lg text-white placeholder-[#7F8B95] focus:ring-2 focus:ring-[#69F0FD] focus:border-[#69F0FD] transition-colors"
              />
              {address2.isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#69F0FD]"></div>
                </div>
              )}
            </div>
            
            {/* Address 2 Suggestions */}
            {address2.showSuggestions && address2.suggestions.length > 0 && (
              <div ref={suggestions2Ref} className="absolute z-50 w-full mt-1 bg-[#002C4D] border border-[#BFC3C7] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {address2.suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionSelect(suggestion, 2)}
                    className="w-full px-4 py-3 text-left hover:bg-[#011B2E] transition-colors border-b border-[#27131D] last:border-b-0"
                  >
                    <div className="text-white font-medium">{suggestion.address}</div>
                    <div className="text-[#BFC3C7] text-sm">{suggestion.city}, {suggestion.state} {suggestion.zip}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Find Button */}
          <button
            onClick={findCourtsInBetween}
            disabled={!address1.selected || !address2.selected || isCalculating}
            className="w-full py-3 px-4 bg-[#EC0037] hover:bg-[#4A1C23] disabled:bg-[#50394D] disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            {isCalculating ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Finding Courts...
              </div>
            ) : (
              'Find Courts in Between'
            )}
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {filteredCourts.length > 0 && (
            <div className="p-6 pt-0">
              <div className="border-t border-[#27131D] pt-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Courts Found ({filteredCourts.length})
                </h3>
                <div className="space-y-3">
                  {filteredCourts.map((court) => (
                    <div
                      key={court.id}
                      onClick={() => handleCourtClick(court)}
                      className={`p-4 bg-[#002C4D] border border-[#BFC3C7] rounded-lg cursor-pointer transition-all duration-200 hover:bg-[#00487E] ${
                        selectedCourt?.id === court.id ? 'ring-2 ring-[#69F0FD] bg-[#00487E]' : ''
                      }`}
                    >
                      <div className="font-medium text-white mb-2">{court.name}</div>
                      <div className="text-[#BFC3C7] text-sm mb-3">{court.address}, {court.city}</div>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[#69F0FD] font-medium">From Address 1:</span>
                          <div className="text-[#BFC3C7]">{court.distanceFromAddress1.toFixed(1)} mi</div>
                          {court.drivingTimeFromAddress1 && (
                            <div className="text-[#918AB5]">{court.drivingTimeFromAddress1}</div>
                          )}
                        </div>
                        <div>
                          <span className="text-[#69F0FD] font-medium">From Address 2:</span>
                          <div className="text-[#BFC3C7]">{court.distanceFromAddress2.toFixed(1)} mi</div>
                          {court.drivingTimeFromAddress2 && (
                            <div className="text-[#918AB5]">{court.drivingTimeFromAddress2}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {filteredCourts.length === 0 && address1.selected && address2.selected && !isCalculating && (
            <div className="p-6 pt-0">
              <div className="border-t border-[#27131D] pt-6">
                <div className="text-center text-[#BFC3C7]">
                  No courts found between the selected addresses. Try expanding your search area.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Panel */}
      <div className="flex-1 relative">
        <GoogleMap
          center={mapCenter}
          zoom={11}
          style={{ height: '100%', width: '100%' }}
        >


          {/* Address markers */}
          {address1.selected && (
            <GoogleMapMarker
              position={{ lat: address1.selected.lat, lng: address1.selected.lon }}
              title="Address 1"
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: '#EC0037', // Crimson Rally
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 3,
              }}
            />
          )}
          
          {address2.selected && (
            <GoogleMapMarker
              position={{ lat: address2.selected.lat, lng: address2.selected.lon }}
              title="Address 2"
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: '#4A1C23', // Battle Bronze
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 3,
              }}
            />
          )}

          {/* Court markers */}
          {filteredCourts.map((court) => (
            <GoogleMapMarker
              key={court.id}
              position={{ lat: court.latitude, lng: court.longitude }}
              title={court.name}
              isPrivate={court.membership_required}
              onClick={() => handleCourtClick(court)}
            />
          ))}
        </GoogleMap>
      </div>
    </div>
  );
}
