import { ExternalLink, MapPin, RefreshCw, Star } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { invalidateCourtCache, type TennisCourt, useCourtData } from '../hooks/useCourtData';

type OptimizedCourtListProps = {
  courts: TennisCourt[];
  onCourtSelect: (court: TennisCourt) => void;
  isMobile?: boolean;
  shouldFocus?: boolean;
  externalSearchQuery?: string;
  onExternalSearchChange?: (query: string) => void;
};

// Memoize the individual court item to prevent unnecessary re-renders
const CourtListItem = React.memo(({
  court,
  onSelect,
}: {
  court: TennisCourt;
  onSelect: (court: TennisCourt) => void;
}) => {
  const handleClick = useCallback(() => {
    onSelect(court);
  }, [court, onSelect]);

  const getDirectionsUrl = useCallback(() => {
    const address = `${court.address}, ${court.city}, ${court.state} ${court.zip}`.replace(/\s+/g, '+');
    return `https://www.google.com/maps/dir/?api=1&destination=${address}`;
  }, [court]);

  const handleDirectionsClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(getDirectionsUrl(), '_blank');
  }, [getDirectionsUrl]);

  return (
    <div
      className="p-3 sm:p-4 hover:bg-[#F4F5F6] border-b border-[#BFC37C] cursor-pointer transition-colors duration-150 bg-[#F4F5F6]"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm sm:text-base text-[#7F8B9F] truncate">
            {court.name}
          </h3>
          <p className="text-xs sm:text-sm text-[#7F8B9F] mt-1">
            {court.address}
            {court.city && `, ${court.city}`}
            {court.zip && court.zip !== '00000' && `, ${court.zip}`}
          </p>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {Number(court.average_rating) > 0 && Number(court.review_count) > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-[#7F8B9F] fill-current" />
                <span className="text-xs sm:text-sm text-[#7F8B9F]">
                  {Number(court.average_rating).toFixed(1)}
                </span>
                <span className="text-xs text-[#7F8B9F]">
                  (
                  {Number(court.review_count)}
                  )
                </span>
              </div>
            )}

            {court.lighted && (
              <span className="text-xs border border-[#BFC37C] text-[#7F8B9F] bg-[#F4F5F6] px-2 py-1 rounded">
                Lighted
              </span>
            )}

            {court.court_type && (
              <span className="text-xs border border-[#BFC37C] text-[#7F8B9F] bg-[#F4F5F6] px-2 py-1 rounded">
                {court.court_type.charAt(0).toUpperCase() + court.court_type.slice(1)}
              </span>
            )}

            {court.membership_required && (
              <span className="text-xs border border-[#BFC37C] text-[#7F8B9F] bg-[#F4F5F6] px-2 py-1 rounded">
                Private
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={handleDirectionsClick}
            className="p-1.5 sm:p-2 text-[#7F8B9F] rounded transition-colors duration-150"
            type="button"
            aria-label="Get directions"
            title="Get directions"
          >
            <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-[#7F8B9F]" />
        </div>
      </div>
    </div>
  );
});

CourtListItem.displayName = 'CourtListItem';

const OptimizedCourtList = React.memo(({
  courts,
  onCourtSelect,
  isMobile = false,
  shouldFocus = false,
  externalSearchQuery = '',
  onExternalSearchChange,
}: OptimizedCourtListProps) => {
  const { refreshCourtData } = useCourtData();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>(['all']);
  const [sortType, setSortType] = useState<'default' | 'az' | 'distance'>('default');
  const [userLocation, _setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const effectiveSearchQuery = isMobile ? externalSearchQuery : searchQuery;

  // Auto-focus search input on mobile when component becomes visible
  useEffect(() => {
    if (isMobile && shouldFocus && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isMobile, shouldFocus]);

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

  // Memoize filtered and sorted courts for better performance
  const filteredCourts = useMemo(() => {
    let filtered = courts;

    // Search filter
    if (effectiveSearchQuery.trim()) {
      const query = effectiveSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(court =>
        court.name.toLowerCase().includes(query)
        || court.address.toLowerCase().includes(query)
        || court.city.toLowerCase().includes(query)
        || court.zip.includes(query),
      );
    }

    // Type filters - use AND logic for combinations
    if (!activeFilters.includes('all')) {
      filtered = filtered.filter((court) => {
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
    }

    // Sorting
    if (sortType === 'az') {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortType === 'distance' && userLocation) {
      filtered = [...filtered].sort((a, b) => {
        const distanceA = calculateDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude);
        const distanceB = calculateDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude);
        return distanceA - distanceB;
      });
    }

    return filtered;
  }, [courts, effectiveSearchQuery, activeFilters, sortType, userLocation, calculateDistance]);

  const handleFilterChange = useCallback((filter: string) => {
    setActiveFilters((prev) => {
      if (filter === 'all') {
        return ['all'];
      }

      const newFilters = prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev.filter(f => f !== 'all'), filter];

      return newFilters.length === 0 ? ['all'] : newFilters;
    });
  }, []);

  const handleLightedToggle = useCallback(() => {
    setActiveFilters((prev) => {
      const newFilters = prev.includes('lighted')
        ? prev.filter(f => f !== 'lighted')
        : [...prev.filter(f => f !== 'all'), 'lighted'];

      return newFilters.length === 0 ? ['all'] : newFilters;
    });
  }, []);

  return (
    <div className="h-full flex flex-col bg-[#F4F5F6] relative">
      {/* Search controls - only show on desktop */}
      {!isMobile && (
        <div className="p-3 sm:p-4 border-b border-[#BFC37C]">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by Name, Address, or Zip Code..."
              value={effectiveSearchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (onExternalSearchChange) {
                  onExternalSearchChange(e.target.value);
                }
              }}
              className="w-full px-3 py-2 border border-[#BFC37C] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#011B2E] text-sm bg-[#F4F5F6] text-[#7F8B9F] placeholder-[#7F8B9F] transition-all"
              ref={searchInputRef}
            />
            {effectiveSearchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  if (onExternalSearchChange) {
                    onExternalSearchChange('');
                  }
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7F8B9F] p-1 transition-colors"
                type="button"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Desktop filter buttons */}
          <div className="mt-3 flex gap-2 flex-wrap">
            <button
              onClick={handleLightedToggle}
              className={`px-3 py-1 rounded-full text-xs transition-colors duration-150 ${
                activeFilters.includes('lighted')
                  ? 'bg-[#BFC37C] text-[#7F8B9F] border border-[#BFC37C] shadow-lg'
                  : 'bg-[#F4F5F6] text-[#7F8B9F] border border-[#BFC37C]'
              }`}
              type="button"
            >
              Lighted
            </button>

            {['public', 'private', 'outdoor', 'indoor'].map(filter => (
              <button
                key={filter}
                onClick={() => handleFilterChange(filter)}
                className={`px-3 py-1 rounded-full text-xs transition-colors duration-150 capitalize ${
                  activeFilters.includes(filter)
                    ? 'bg-[#BFC37C] text-[#7F8B9F] border border-[#BFC37C] shadow-lg'
                    : 'bg-[#F4F5F6] text-[#7F8B9F] border border-[#BFC37C]'
                }`}
                type="button"
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Sort options and refresh button */}
          <div className="mt-2 flex items-center gap-2">
            <select
              value={sortType}
              onChange={e => setSortType(e.target.value as 'default' | 'az' | 'distance')}
              className="text-xs border border-[#BFC37C] rounded px-2 py-1 flex-1 bg-[#F4F5F6] text-[#7F8B9F] focus:outline-none focus:ring-2 focus:ring-[#011B2E] transition-all"
            >
              <option value="default">Default Order</option>
              <option value="az">A-Z</option>
              <option value="distance">Distance (if location enabled)</option>
            </select>

            <button
              onClick={async () => {
                setIsRefreshing(true);
                try {
                  invalidateCourtCache();
                  await refreshCourtData();
                } catch (error) {
                  console.error('Error refreshing courts:', error);
                } finally {
                  setIsRefreshing(false);
                }
              }}
              disabled={isRefreshing}
              className={`px-2 py-1 text-xs border border-[#BFC37C] rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 shadow ${
                isRefreshing ? 'bg-[#F4F5F6] text-[#7F8B9F]' : 'bg-[#F4F5F6] text-[#7F8B9F]'
              }`}
              type="button"
              title="Refresh court data"
              aria-label="Refresh court data"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      )}

      {/* Courts list */}
      <div className="flex-1 overflow-y-auto">
        {filteredCourts.length === 0
          ? (
              <div className="p-4 text-center text-[#7F8B9F] text-sm">
                {effectiveSearchQuery ? 'No courts found matching your search.' : 'No courts available.'}
              </div>
            )
          : (
              <div>
                {filteredCourts.map(court => (
                  <CourtListItem
                    key={court.id}
                    court={court}
                    onSelect={onCourtSelect}
                  />
                ))}
              </div>
            )}
      </div>
    </div>
  );
});

OptimizedCourtList.displayName = 'OptimizedCourtList';

export default OptimizedCourtList;
