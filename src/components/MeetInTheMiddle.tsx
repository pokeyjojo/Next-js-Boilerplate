'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { type TennisCourt, useCourtData } from '@/hooks/useCourtData';
import { type AddressSuggestion, searchAddresses } from '@/libs/GoogleMapsService';
import GoogleMap from './GoogleMap';
import GoogleMapMarker from './GoogleMapMarker';

type MeetInTheMiddleProps = {
  onCourtSelect: (court: TennisCourt) => void;
};

type AddressInput = {
  query: string;
  selected: AddressSuggestion | null;
  suggestions: AddressSuggestion[];
  showSuggestions: boolean;
  isSearching: boolean;
};

type CourtWithDistances = {
  distanceFromAddress1: number;
  distanceFromAddress2: number;
  drivingTimeFromAddress1?: string;
  drivingTimeFromAddress2?: string;
  totalDistance?: number;
} & TennisCourt;

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
  const [allFoundCourts, setAllFoundCourts] = useState<CourtWithDistances[]>([]);
  const [hasValidSearch, setHasValidSearch] = useState(false); // Track if we have search results to display
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState<CourtWithDistances | null>(null);
  const [mostEquidistantCourt, setMostEquidistantCourt] = useState<CourtWithDistances | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 41.8781, lng: -87.6298, zoom: 11 }); // Chicago center

  // Filter state - moved to first screen
  const [activeFilters, setActiveFilters] = useState<string[]>(['all']);

  // Performance tracking
  const [searchProgress, setSearchProgress] = useState<{
    phase: string;
    current: number;
    total: number;
  } | null>(null);

  const address1InputRef = useRef<HTMLInputElement>(null);
  const address2InputRef = useRef<HTMLInputElement>(null);
  const suggestions1Ref = useRef<HTMLDivElement>(null);
  const suggestions2Ref = useRef<HTMLDivElement>(null);
  const searchTimeout1Ref = useRef<NodeJS.Timeout | null>(null);
  const searchTimeout2Ref = useRef<NodeJS.Timeout | null>(null);

  // Function to center the map by updating the mapCenter state
  const setMapTarget = useCallback((lat: number, lng: number, zoom: number) => {
    // Validate coordinates before setting
    if (Number.isNaN(lat) || Number.isNaN(lng) || lat === 0 || lng === 0) {
      console.warn('Invalid coordinates provided, falling back to Chicago:', { lat, lng, zoom });
      lat = 41.8781;
      lng = -87.6298;
      zoom = 11;
    }

    const newCenter = { lat, lng, zoom };
    setMapCenter(newCenter);
  }, []);

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

  // Get driving distances using modern Routes API
  const getDrivingDistances = useCallback(async (courts: CourtWithDistances[], addr1: AddressSuggestion, addr2: AddressSuggestion, onProgress?: (current: number, total: number) => void) => {
    if (courts.length === 0) {
      return courts;
    }

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

        // Report progress
        if (onProgress) {
          onProgress(i, courts.length);
        }

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
                  'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters',
                },
                body: JSON.stringify({
                  origin: {
                    location: {
                      latLng: {
                        latitude: addr1.lat,
                        longitude: addr1.lon,
                      },
                    },
                  },
                  destination: {
                    location: {
                      latLng: {
                        latitude: court.latitude,
                        longitude: court.longitude,
                      },
                    },
                  },
                  travelMode: 'DRIVE',
                  routingPreference: 'TRAFFIC_AWARE',
                  units: 'IMPERIAL',
                }),
              });

              // Get driving time from address 2 to court using Routes API
              const route2Response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Goog-Api-Key': apiKey,
                  'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters',
                },
                body: JSON.stringify({
                  origin: {
                    location: {
                      latLng: {
                        latitude: addr2.lat,
                        longitude: addr2.lon,
                      },
                    },
                  },
                  destination: {
                    location: {
                      latLng: {
                        latitude: court.latitude,
                        longitude: court.longitude,
                      },
                    },
                  },
                  travelMode: 'DRIVE',
                  routingPreference: 'TRAFFIC_AWARE',
                  units: 'IMPERIAL',
                }),
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
                    const seconds = Number.parseInt(duration.replace('s', ''));
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
                    const seconds = Number.parseInt(duration.replace('s', ''));
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
          }),
        );

        // Longer delay between batches for Routes API rate limits
        if (i + batchSize < courts.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      // Report completion
      if (onProgress) {
        onProgress(courts.length, courts.length);
      }

      return updatedCourts;
    } catch (error) {
      console.error('Error getting driving distances:', error);
      console.warn('Continuing without driving times due to API error');
      return courts;
    }
  }, []);

  // Handle address search
  const handleAddressSearch = useCallback(async (
    searchTerm: string,
    addressNumber: 1 | 2,
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

  // Optimized court finding with cumulative distance sorting and maximum distance constraint
  const findCourtsInBetween = useCallback(async () => {
    if (!address1.selected || !address2.selected) {
      console.warn('Cannot find courts: missing address selections', {
        address1Selected: !!address1.selected,
        address2Selected: !!address2.selected,
      });
      return;
    }

    setIsCalculating(true);
    setHasValidSearch(false); // Clear previous search results from map
    setSelectedCourt(null);
    setMostEquidistantCourt(null);
    setSearchProgress({ phase: 'Calculating baseline distance...', current: 0, total: 100 });

    try {
      // STEP 1: Calculate the distance between the two addresses to establish maximum constraint
      const maxAllowedDistance = calculateDistance(
        address1.selected.lat,
        address1.selected.lon,
        address2.selected.lat,
        address2.selected.lon,
      );

      // Calculate appropriate zoom level based on distance between addresses
      const getZoomLevel = (distance: number): number => {
        if (distance <= 5) {
          return 13; // Very close addresses
        }
        if (distance <= 10) {
          return 12; // Close addresses
        }
        if (distance <= 25) {
          return 11; // Moderate distance
        }
        if (distance <= 50) {
          return 10; // Far apart
        }
        if (distance <= 100) {
          return 9; // Very far apart
        }
        return 8; // Extremely far apart
      };

      setSearchProgress({ phase: 'Filtering by type...', current: 10, total: 100 });

      // STEP 2: Pre-filter courts by type/features BEFORE expensive calculations
      let filteredByType = courts;
      if (!activeFilters.includes('all')) {
        filteredByType = courts.filter((court) => {
          if (activeFilters.includes('public') && court.membership_required) {
            return false;
          }
          if (activeFilters.includes('private') && !court.membership_required) {
            return false;
          }
          if (activeFilters.includes('lighted') && !court.lighted) {
            return false;
          }
          if (activeFilters.includes('outdoor') && !court.court_type?.toLowerCase().includes('outdoor')) {
            return false;
          }
          if (activeFilters.includes('indoor') && !court.court_type?.toLowerCase().includes('indoor')) {
            return false;
          }
          return true;
        });
      }

      setSearchProgress({ phase: 'Calculating distances and applying constraints...', current: 20, total: 100 });

      // STEP 3: Calculate distances for all courts and apply the driving distance constraint
      const courtsWithDistances: CourtWithDistances[] = filteredByType
        .map((court) => {
          const distanceFromAddress1 = calculateDistance(
            address1.selected!.lat,
            address1.selected!.lon,
            court.latitude,
            court.longitude,
          );
          const distanceFromAddress2 = calculateDistance(
            address2.selected!.lat,
            address2.selected!.lon,
            court.latitude,
            court.longitude,
          );

          return {
            ...court,
            distanceFromAddress1,
            distanceFromAddress2,
            totalDistance: distanceFromAddress1 + distanceFromAddress2,
          };
        })
        .filter((court) => {
          // Apply constraint: neither driver should drive more than the distance between addresses
          return court.distanceFromAddress1 <= maxAllowedDistance
            && court.distanceFromAddress2 <= maxAllowedDistance;
        });

      if (courtsWithDistances.length === 0) {
        console.warn('No courts found within distance constraints', {
          totalCourtsAfterTypeFilter: filteredByType.length,
          maxAllowedDistance,
          address1: address1.selected ? { lat: address1.selected.lat, lon: address1.selected.lon } : null,
          address2: address2.selected ? { lat: address2.selected.lat, lon: address2.selected.lon } : null,
        });

        // Even with no courts, center the map on the midpoint between addresses
        if (address1.selected && address2.selected
          && !Number.isNaN(address1.selected.lat) && !Number.isNaN(address2.selected.lat)
          && !Number.isNaN(address1.selected.lon) && !Number.isNaN(address2.selected.lon)) {
          const centerLat = (address1.selected.lat + address2.selected.lat) / 2;
          const centerLng = (address1.selected.lon + address2.selected.lon) / 2;
          const zoomLevel = getZoomLevel(maxAllowedDistance);
          console.warn('No courts found - centering on midpoint between addresses:', { lat: centerLat, lng: centerLng });
          setMapTarget(centerLat, centerLng, zoomLevel);
        } else {
          console.warn('No courts found and invalid addresses - centering on Chicago');
          setMapTarget(41.8781, -87.6298, 11);
        }

        setAllFoundCourts([]);
        setHasValidSearch(false); // Clear search state
        setSearchProgress(null);
        setIsCalculating(false);
        return;
      }

      setSearchProgress({ phase: 'Sorting by cumulative distance...', current: 30, total: 100 });

      // STEP 4: Sort by cumulative distance (total distance) - closest total distance first
      const sortedCourts = courtsWithDistances.sort((a, b) => {
        return (a.totalDistance || 0) - (b.totalDistance || 0);
      });

      setSearchProgress({ phase: 'Optimizing results...', current: 40, total: 100 });

      // STEP 5: Limit to top 15 most promising courts to reduce API calls
      const topCourts = sortedCourts.slice(0, 15);

      setSearchProgress({ phase: 'Getting driving directions...', current: 50, total: 100 });

      // STEP 6: Get driving distances with progress tracking
      const courtsWithDrivingTimes = await getDrivingDistances(
        topCourts,
        address1.selected!,
        address2.selected!,
        (current: number, total: number) => {
          const progressPercent = 50 + Math.floor((current / total) * 50);
          setSearchProgress({
            phase: `Getting directions... (${current}/${total})`,
            current: progressPercent,
            total: 100,
          });
        },
      );

      setAllFoundCourts(courtsWithDrivingTimes);
      setHasValidSearch(true); // Mark that we have valid search results

      // Find the court with the most equal driving distances (most equidistant)
      let mostEquidistantCourt: CourtWithDistances | null = null;
      let smallestDistanceDifference = Number.POSITIVE_INFINITY;

      courtsWithDrivingTimes.forEach((court) => {
        const distanceDifference = Math.abs(court.distanceFromAddress1 - court.distanceFromAddress2);
        if (distanceDifference < smallestDistanceDifference) {
          smallestDistanceDifference = distanceDifference;
          mostEquidistantCourt = court;
        }
      });

      // Log most equidistant court for debugging
      if (mostEquidistantCourt) {
        console.warn('Most equidistant court found with smallest difference:', smallestDistanceDifference);
      }

      const zoomLevel = getZoomLevel(maxAllowedDistance);

      // Store the most equidistant court for UI highlighting
      setMostEquidistantCourt(mostEquidistantCourt);

      // Always center the map appropriately
      let finalLat: number;
      let finalLng: number;
      let finalZoom: number = zoomLevel;

      if (mostEquidistantCourt) {
        // Center on the most equidistant court
        const court = mostEquidistantCourt as CourtWithDistances;
        finalLat = court.latitude;
        finalLng = court.longitude;
        console.warn('Centering map on most equidistant court:', court.name, { lat: finalLat, lng: finalLng });
      } else if (address1.selected && address2.selected
        && !Number.isNaN(address1.selected.lat) && !Number.isNaN(address2.selected.lat)
        && !Number.isNaN(address1.selected.lon) && !Number.isNaN(address2.selected.lon)) {
        // Center on midpoint between addresses
        finalLat = (address1.selected.lat + address2.selected.lat) / 2;
        finalLng = (address1.selected.lon + address2.selected.lon) / 2;
        console.warn('Centering map on midpoint between addresses:', { lat: finalLat, lng: finalLng });
      } else {
        // Fallback to Chicago center
        finalLat = 41.8781;
        finalLng = -87.6298;
        finalZoom = 11;
        console.warn('Fallback: centering map on Chicago');
      }

      // Always call setMapTarget to ensure map is positioned
      setMapTarget(finalLat, finalLng, finalZoom);

      setSearchProgress({ phase: 'Complete!', current: 100, total: 100 });
      setTimeout(() => setSearchProgress(null), 1000);
    } catch (error) {
      console.error('Error finding courts:', error);
      setSearchProgress(null);
    } finally {
      setIsCalculating(false);
    }
  }, [address1.selected, address2.selected, courts, calculateDistance, getDrivingDistances, activeFilters, setMapTarget]);

  // Filter handler functions
  const handleFilterChange = useCallback((filter: string) => {
    setActiveFilters((prev) => {
      if (filter === 'all') {
        return ['all'];
      }

      const newFilters = prev.filter(f => f !== 'all');

      if (newFilters.includes(filter)) {
        const filtered = newFilters.filter(f => f !== filter);
        return filtered.length === 0 ? ['all'] : filtered;
      } else {
        return [...newFilters, filter];
      }
    });
  }, []);

  // Apply filters to courts
  const applyFilters = useCallback((courts: CourtWithDistances[]): CourtWithDistances[] => {
    if (activeFilters.includes('all')) {
      return courts;
    }

    return courts.filter((court) => {
      // Check if court matches ALL active filters (AND logic)
      for (const filter of activeFilters) {
        switch (filter) {
          case 'public':
            if (court.membership_required) {
              return false;
            }
            break;
          case 'private':
            if (!court.membership_required) {
              return false;
            }
            break;
          case 'outdoor':
            if (!court.court_type?.toLowerCase().includes('outdoor')) {
              return false;
            }
            break;
          case 'indoor':
            if (!court.court_type?.toLowerCase().includes('indoor')) {
              return false;
            }
            break;
          case 'lighted':
            if (!court.lighted) {
              return false;
            }
            break;
        }
      }
      return true; // All filters passed
    });
  }, [activeFilters]);

  // Get filtered courts based on current filters
  const filteredCourts = applyFilters(allFoundCourts);

  // Get filtered courts for map display (only show when we have valid search results)
  const filteredDisplayedCourts = hasValidSearch ? applyFilters(allFoundCourts) : [];

  // Handle court selection
  const handleCourtClick = (court: CourtWithDistances) => {
    setSelectedCourt(court);
    onCourtSelect(court);
  };

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestions1Ref.current
        && !suggestions1Ref.current.contains(event.target as Node)
        && address1InputRef.current
        && !address1InputRef.current.contains(event.target as Node)
      ) {
        setAddress1(prev => ({ ...prev, showSuggestions: false }));
      }
      if (
        suggestions2Ref.current
        && !suggestions2Ref.current.contains(event.target as Node)
        && address2InputRef.current
        && !address2InputRef.current.contains(event.target as Node)
      ) {
        setAddress2(prev => ({ ...prev, showSuggestions: false }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (searchTimeout1Ref.current) {
        clearTimeout(searchTimeout1Ref.current);
      }
      if (searchTimeout2Ref.current) {
        clearTimeout(searchTimeout2Ref.current);
      }
    };
  }, []);

  return (
    <div className="h-full flex flex-col lg:flex-row bg-[#002C4D] overflow-hidden">
      {/* Input Panel */}
      <div
        className="w-full lg:w-1/3 bg-[#011B2E] border-r border-[#27131D] overflow-y-auto overscroll-contain"
        onWheel={(e) => {
          e.stopPropagation();
          const target = e.currentTarget;
          if ((e.deltaY < 0 && target.scrollTop === 0)
            || (e.deltaY > 0 && target.scrollTop >= target.scrollHeight - target.clientHeight)) {
            e.preventDefault();
          }
        }}
        onTouchMove={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#27131D]">
          <h2 className="text-2xl font-bold text-[#EC0037] mb-2">Meet in the Middle</h2>
          <p className="text-[#BFC3C7] text-sm">
            Find tennis courts ordered by total driving distance. Neither player will drive more than the distance between your two addresses.
          </p>
        </div>

        {/* Address Inputs */}
        <div className="p-6 space-y-6">
          {/* Address 1 */}
          <div className="relative">
            <label htmlFor="address1-input" className="block text-[#FFFFFF] font-medium mb-2">
              First Address
            </label>
            <div className="relative">
              <input
                id="address1-input"
                ref={address1InputRef}
                type="text"
                value={address1.query}
                onChange={e => handleAddressInputChange(e.target.value, 1)}
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
              <div
                ref={suggestions1Ref}
                className="absolute z-50 w-full mt-1 bg-[#002C4D] border border-[#BFC3C7] rounded-lg shadow-lg max-h-60 overflow-y-auto overscroll-contain"
                onWheel={e => e.stopPropagation()}
                onTouchMove={e => e.stopPropagation()}
              >
                {address1.suggestions.map((suggestion, index) => (
                  <button
                    key={`addr1-${suggestion.address}-${index}`}
                    type="button"
                    onClick={() => handleSuggestionSelect(suggestion, 1)}
                    className="w-full px-4 py-3 text-left hover:bg-[#011B2E] transition-colors border-b border-[#27131D] last:border-b-0"
                  >
                    <div className="text-white font-medium">{suggestion.address}</div>
                    <div className="text-[#BFC3C7] text-sm">
                      {suggestion.city}
                      ,
                      {' '}
                      {suggestion.state}
                      {' '}
                      {suggestion.zip}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Address 2 */}
          <div className="relative">
            <label htmlFor="address2-input" className="block text-[#FFFFFF] font-medium mb-2">
              Second Address
            </label>
            <div className="relative">
              <input
                id="address2-input"
                ref={address2InputRef}
                type="text"
                value={address2.query}
                onChange={e => handleAddressInputChange(e.target.value, 2)}
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
              <div
                ref={suggestions2Ref}
                className="absolute z-50 w-full mt-1 bg-[#002C4D] border border-[#BFC3C7] rounded-lg shadow-lg max-h-60 overflow-y-auto overscroll-contain"
                onWheel={e => e.stopPropagation()}
                onTouchMove={e => e.stopPropagation()}
              >
                {address2.suggestions.map((suggestion, index) => (
                  <button
                    key={`addr2-${suggestion.address}-${index}`}
                    type="button"
                    onClick={() => handleSuggestionSelect(suggestion, 2)}
                    className="w-full px-4 py-3 text-left hover:bg-[#011B2E] transition-colors border-b border-[#27131D] last:border-b-0"
                  >
                    <div className="text-white font-medium">{suggestion.address}</div>
                    <div className="text-[#BFC3C7] text-sm">
                      {suggestion.city}
                      ,
                      {' '}
                      {suggestion.state}
                      {' '}
                      {suggestion.zip}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Court Filters */}
          <div className="space-y-3">
            <div className="block text-[#FFFFFF] font-medium">
              Filter Courts
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleFilterChange('all')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  activeFilters.includes('all')
                    ? 'bg-[#69F0FD] text-[#002C4D] hover:bg-[#918AB5]'
                    : 'bg-[#27131D] text-[#BFC3C7] hover:bg-[#50394D]'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange('lighted')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  activeFilters.includes('lighted')
                    ? 'bg-[#EC0037] text-white hover:bg-[#4A1C23]'
                    : 'bg-[#27131D] text-[#BFC3C7] hover:bg-[#50394D]'
                }`}
              >
                Lighted
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange('public')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  activeFilters.includes('public')
                    ? 'bg-[#EC0037] text-white hover:bg-[#4A1C23]'
                    : 'bg-[#27131D] text-[#BFC3C7] hover:bg-[#50394D]'
                }`}
              >
                Public
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange('private')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  activeFilters.includes('private')
                    ? 'bg-[#EC0037] text-white hover:bg-[#4A1C23]'
                    : 'bg-[#27131D] text-[#BFC3C7] hover:bg-[#50394D]'
                }`}
              >
                Private
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange('outdoor')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  activeFilters.includes('outdoor')
                    ? 'bg-[#EC0037] text-white hover:bg-[#4A1C23]'
                    : 'bg-[#27131D] text-[#BFC3C7] hover:bg-[#50394D]'
                }`}
              >
                Outdoor
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange('indoor')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  activeFilters.includes('indoor')
                    ? 'bg-[#EC0037] text-white hover:bg-[#4A1C23]'
                    : 'bg-[#27131D] text-[#BFC3C7] hover:bg-[#50394D]'
                }`}
              >
                Indoor
              </button>
            </div>
          </div>

          {/* Progress Indicator */}
          {searchProgress && (
            <div className="space-y-3">
              <div className="text-[#69F0FD] text-sm font-medium">
                {searchProgress.phase}
              </div>
              <div className="w-full bg-[#27131D] rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-[#EC0037] to-[#69F0FD] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${searchProgress.current}%` }}
                >
                </div>
              </div>
              <div className="text-[#BFC3C7] text-xs text-center">
                {searchProgress.current}
                % complete
              </div>
            </div>
          )}

          {/* Find Button */}
          <button
            type="button"
            onClick={findCourtsInBetween}
            disabled={!address1.selected || !address2.selected || isCalculating}
            className="w-full px-4 py-2 bg-[#EC0037] text-white rounded-lg font-semibold hover:bg-[#4A1C23] disabled:bg-[#50394D] disabled:cursor-not-allowed transition-colors"
          >
            {isCalculating
              ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Finding Courts...
                  </div>
                )
              : (
                  'Find Courts in Between'
                )}
          </button>
        </div>

        {/* Results */}
        <div>
          {allFoundCourts.length > 0 && (
            <div className="p-6 pt-0">
              <div className="border-t border-[#27131D] pt-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Courts Found (
                    {filteredCourts.length}
                    )
                  </h3>
                  <p className="text-[#BFC3C7] text-xs mb-2">
                    Sorted by total driving distance (lowest first) • Map centered on most equidistant court
                  </p>
                  {!activeFilters.includes('all') && (
                    <div className="text-[#69F0FD] text-sm">
                      Filtered by:
                      {' '}
                      {activeFilters.join(', ')}
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {filteredCourts.map(court => (
                    <button
                      key={court.id}
                      type="button"
                      onClick={() => handleCourtClick(court)}
                      className={`w-full text-left p-4 bg-[#002C4D] border rounded-lg cursor-pointer transition-all duration-200 hover:bg-[#00487E] ${
                        selectedCourt?.id === court.id
                          ? 'ring-2 ring-[#69F0FD] bg-[#00487E] border-[#69F0FD]'
                          : mostEquidistantCourt?.id === court.id
                            ? 'border-[#EC0037] border-2 bg-[#4A1C23]'
                            : 'border-[#BFC3C7]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-white">{court.name}</div>
                        {mostEquidistantCourt?.id === court.id && (
                          <div className="px-2 py-1 bg-[#EC0037] text-white text-xs rounded-full font-medium">
                            Map Center
                          </div>
                        )}
                      </div>
                      <div className="text-[#BFC3C7] text-sm mb-3">
                        {court.address}
                        ,
                        {' '}
                        {court.city}
                      </div>

                      {/* Cumulative Distance Display */}
                      <div className="mb-3 p-2 bg-[#011B2E] rounded border border-[#27131D]">
                        <div className="text-[#69F0FD] font-medium text-xs mb-1">Total Distance:</div>
                        <div className="text-[#FFFFFF] font-semibold">
                          {(court.totalDistance || 0).toFixed(1)}
                          {' '}
                          mi
                        </div>
                        <div className="text-[#918AB5] text-xs mt-1">
                          Combined driving distance for both players
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[#69F0FD] font-medium">From Address 1:</span>
                          <div className="text-[#BFC3C7]">
                            {court.distanceFromAddress1.toFixed(1)}
                            {' '}
                            mi
                          </div>
                          {court.drivingTimeFromAddress1 && (
                            <div className="text-[#918AB5]">{court.drivingTimeFromAddress1}</div>
                          )}
                        </div>
                        <div>
                          <span className="text-[#69F0FD] font-medium">From Address 2:</span>
                          <div className="text-[#BFC3C7]">
                            {court.distanceFromAddress2.toFixed(1)}
                            {' '}
                            mi
                          </div>
                          {court.drivingTimeFromAddress2 && (
                            <div className="text-[#918AB5]">{court.drivingTimeFromAddress2}</div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {allFoundCourts.length === 0 && address1.selected && address2.selected && !isCalculating && (
            <div className="p-6 pt-0">
              <div className="border-t border-[#27131D] pt-6">
                <div className="text-center text-[#BFC3C7]">
                  No courts found between the selected addresses. Try expanding your search area.
                </div>
              </div>
            </div>
          )}

          {allFoundCourts.length > 0 && filteredCourts.length === 0 && (
            <div className="p-6 pt-0">
              <div className="border-t border-[#27131D] pt-6">
                <div className="text-center text-[#BFC3C7]">
                  No courts match the selected filters. Try removing some filters to see more results.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Panel */}
      <div className="flex-1 relative">
        <GoogleMap
          center={{ lat: mapCenter.lat, lng: mapCenter.lng }}
          zoom={mapCenter.zoom}
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
          {filteredDisplayedCourts.map(court => (
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
