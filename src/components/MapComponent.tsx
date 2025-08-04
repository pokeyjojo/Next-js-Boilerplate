'use client';

import type { LatLngTuple } from 'leaflet';
import { setTimeout } from 'node:timers';
import { useUser } from '@clerk/nextjs';
import L from 'leaflet';
import { Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import { useCourtSuggestions } from '@/hooks/useCourtSuggestions';
import { capitalizeFirstLetter } from '@/utils/Helpers';
import { invalidateCourtCache, type TennisCourt, useCourtData } from '../hooks/useCourtData';
import AdminCourtEdit from './AdminCourtEdit';
import AllSuggestionsDisplay from './AllSuggestionsDisplay';
import CourtEditSuggestion from './CourtEditSuggestion';
import CourtPhotoGallery from './CourtPhotoGallery';
import CourtPhotoUpload from './CourtPhotoUpload';
import NewCourtSuggestionForm from './NewCourtSuggestionForm';
import OptimizedCourtList from './OptimizedCourtList';
import PhotoUpload from './PhotoUpload';
import PhotoViewer from './PhotoViewer';
import UserSuggestionDisplay from './UserSuggestionDisplay';
import 'leaflet/dist/leaflet.css';

const CHICAGO_CENTER: LatLngTuple = [41.8781, -87.6298];

// Custom marker icons for public and private courts
const createCustomIcon = (isPrivate: boolean) => {
  const color = isPrivate ? '#EC0037' : '#002C4D';
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid #FFFFFF;
        box-shadow: 0 0 10px rgba(39,19,29,0.4);
      ">
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Add the pulse animation to the document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .custom-marker {
      transition: transform 0.2s ease;
      }
    .custom-marker:hover {
      transform: scale(1.1);
    }
  `;
  document.head.appendChild(style);
}

export function MapController() {
  const map = useMap();

  useEffect(() => {
    map.setView(CHICAGO_CENTER, 11);
  }, [map]);

  return null;
}

export function TennisCourtMarkers() {
  const { courts, loading, error } = useCourtData();
  const router = useRouter();

  const handleMarkerClick = useCallback((courtId: number) => {
    router.push(`/en/courts/${courtId}`);
  }, [router]);

  if (loading) {
    return null;
  }
  if (error) {
    console.error('Error state:', error);
    return null;
  }

  return (
    <>
      {courts.map((court) => {
        return (
          <Marker
            key={court.id}
            position={[court.latitude, court.longitude]}
            icon={createCustomIcon(court.membership_required)}
            eventHandlers={{
              click: () => handleMarkerClick(court.id),
            }}
          />
        );
      })}
    </>
  );
}

// Unified CourtList component that handles its own search state
const CourtList = ({
  courts,
  onCourtSelect,
  isMobile = false,
  shouldFocus = false,
  externalSearchQuery = '',
  onExternalSearchChange,
}: {
  courts: TennisCourt[];
  onCourtSelect: (court: TennisCourt) => void;
  isMobile?: boolean;
  shouldFocus?: boolean;
  externalSearchQuery?: string;
  onExternalSearchChange?: (query: string) => void;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showLightedOnly, setShowLightedOnly] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>(['all']);
  const [sortType, setSortType] = useState<'default' | 'az' | 'distance'>('default');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Use external search query on mobile, internal on desktop
  const effectiveSearchQuery = isMobile ? externalSearchQuery : searchQuery;

  // Auto-focus search input on mobile when component becomes visible
  useEffect(() => {
    if (isMobile && shouldFocus && searchInputRef.current) {
      // Small delay to ensure the component is fully rendered and visible
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isMobile, shouldFocus]);

  // Get directions URL function
  const getDirectionsUrl = (court: TennisCourt) => {
    const address = `${court.address}, ${court.city}, ${court.state} ${court.zip}`.replace(/\s+/g, '+');
    return `https://www.google.com/maps/dir/?api=1&destination=${address}`;
  };

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
      + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
      * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Get user location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          if (sortType === 'distance') {
            setSortType('distance'); // Trigger re-sort
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          // If location access fails, fall back to A-Z sorting
          if (sortType === 'distance') {
            setSortType('az');
          }
        },
      );
    } else {
      console.error('Geolocation not supported');
      if (sortType === 'distance') {
        setSortType('az');
      }
    }
  };

  // Handle sort toggle
  const handleSortToggle = (newSortType: 'az' | 'distance') => {
    if (sortType === newSortType) {
      // If clicking the same button, turn it off (back to default)
      setSortType('default');
    } else {
      // Switch to the new sort type
      setSortType(newSortType);

      if (newSortType === 'distance' && !userLocation) {
        getUserLocation();
      }
    }
  };

  // Filter options for quick access
  const filterOptions = [
    { key: 'all', label: 'All', count: courts.length },
    { key: 'public', label: 'Public', count: courts.filter(c => !c.membership_required).length },
    { key: 'private', label: 'Private', count: courts.filter(c => c.membership_required).length },
    { key: 'lighted', label: 'Lights', count: courts.filter(c => c.lighted).length },
    { key: 'hard', label: 'Hard Court', count: courts.filter(c => c.surface?.toLowerCase().includes('hard')).length },
    { key: 'clay', label: 'Clay Court', count: courts.filter(c => c.surface?.toLowerCase().includes('clay')).length },
  ];

  // Apply quick filter
  const applyQuickFilter = (filterKey: string) => {
    setSearchQuery('');

    if (filterKey === 'all') {
      setActiveFilters(['all']);
      setShowLightedOnly(false);
      return;
    }

    setActiveFilters((prev) => {
      const newFilters = prev.filter(f => f !== 'all'); // Remove 'all' when selecting specific filters

      if (newFilters.includes(filterKey)) {
        // Remove filter if already active
        const updated = newFilters.filter(f => f !== filterKey);
        // If no filters left, default to 'all'
        return updated.length === 0 ? ['all'] : updated;
      } else {
        // Add new filter
        return [...newFilters, filterKey];
      }
    });

    // Handle lights filter separately for desktop compatibility
    if (filterKey === 'lighted') {
      setShowLightedOnly(true);
    }
  };

  // Memoize filtered courts to prevent recalculation on every render
  const filteredCourts = useMemo(() => {
    const searchTerms = effectiveSearchQuery.toLowerCase().trim().split(/\s+/).filter(term => term.length > 0);

    const filtered = courts.filter((court) => {
      // Apply multiple filters
      if (!activeFilters.includes('all')) {
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
            case 'lighted':
              if (!court.lighted) {
                return false;
              }
              break;
            case 'hard':
              if (!court.surface?.toLowerCase().includes('hard')) {
                return false;
              }
              break;
            case 'clay':
              if (!court.surface?.toLowerCase().includes('clay')) {
                return false;
              }
              break;
          }
        }
      }

      // Apply lights filter (for desktop compatibility)
      if (showLightedOnly && !court.lighted) {
        return false;
      }

      // If no search terms, return true if filters matched
      if (searchTerms.length === 0) {
        return true;
      }

      // Special handling for public/private terms
      const publicPrivateTerms = searchTerms.filter(term =>
        term === 'public' || term === 'private',
      );
      // Get remaining terms
      const otherTerms = searchTerms.filter(term =>
        term !== 'public' && term !== 'private',
      );

      // Check public/private status first
      const matchesPublicPrivate = publicPrivateTerms.length === 0
        || publicPrivateTerms.some(term =>
          (term === 'public' && !court.membership_required)
          || (term === 'private' && court.membership_required),
        );

      if (!matchesPublicPrivate) {
        return false;
      }

      // If no other terms, return true if special terms matched
      if (otherTerms.length === 0) {
        return true;
      }

      // Check other search terms
      const searchableFields = [
        court.name,
        court.address,
        court.city,
        court.state,
        court.zip,
        court.court_type,
        court.surface,
      ].map(field => (field || '').toLowerCase());

      return otherTerms.every(term =>
        searchableFields.some(field => field.includes(term)),
      );
    });

    // Apply sorting
    if (sortType === 'az') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortType === 'distance' && userLocation) {
      filtered.sort((a, b) => {
        const distanceA = calculateDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude);
        const distanceB = calculateDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude);
        return distanceA - distanceB;
      });
    }

    return filtered;
  }, [courts, effectiveSearchQuery, showLightedOnly, activeFilters, sortType, userLocation]);

  return (
    <div className="h-full flex flex-col bg-white relative">
      {/* Search controls - only show on desktop */}
      {!isMobile && (
        <div
          className="p-3 sm:p-4 border-b"
        >
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
              className="w-full px-3 py-2 border border-[#BFC3C7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC0037] text-sm bg-[#FFFFFF] text-[#27131D]"
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Desktop filter buttons */}
          <div className="mt-3 flex gap-2 flex-wrap">
            {filterOptions.map(filter => (
              <button
                key={filter.key}
                onClick={() => applyQuickFilter(filter.key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeFilters.includes(filter.key)
                    ? 'bg-[#EC0037] text-white shadow-lg'
                    : 'bg-[#00487E] text-white hover:bg-[#69F0FD] hover:text-[#27131D] border border-[#BFC3C7]'
                }`}
              >
                {filter.label}
                <span className="ml-1 text-sm opacity-75">
                  (
                  {filter.count}
                  )
                </span>
              </button>
            ))}

            {/* Desktop sort buttons */}
            <button
              onClick={() => handleSortToggle('az')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                sortType === 'az'
                  ? 'bg-[#002C4D] text-white shadow-lg'
                  : 'bg-[#00487E] text-white hover:bg-[#69F0FD] hover:text-[#27131D] border border-[#BFC3C7]'
              }`}
            >
              A-Z
            </button>

            <button
              onClick={() => handleSortToggle('distance')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                sortType === 'distance'
                  ? 'bg-[#002C4D] text-white shadow-lg'
                  : 'bg-[#00487E] text-white hover:bg-[#69F0FD] hover:text-[#27131D] border border-[#BFC3C7]'
              }`}
            >
              Distance
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between">
            {/* Lights checkbox removed - now handled by filter buttons */}
          </div>
          <div className="mt-2 text-xs sm:text-sm text-gray-500">
            {filteredCourts.length}
            {' '}
            {filteredCourts.length === 1 ? 'court' : 'courts'}
            {' '}
            found
            {effectiveSearchQuery && (
              <span className="ml-2">
                matching "
                {effectiveSearchQuery}
                "
              </span>
            )}
          </div>
        </div>
      )}

      {/* Mobile filter buttons - only show in court list */}
      {isMobile && (
        <div className="p-2 border-b">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {filterOptions.map(filter => (
              <button
                key={filter.key}
                onClick={() => applyQuickFilter(filter.key)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeFilters.includes(filter.key)
                    ? 'bg-[#EC0037] text-white shadow-lg'
                    : 'bg-[#00487E] text-white hover:bg-[#69F0FD] hover:text-[#27131D] border border-[#BFC3C7]'
                }`}
              >
                {filter.label}
                <span className="ml-1 text-xs opacity-75">
                  (
                  {filter.count}
                  )
                </span>
              </button>
            ))}

            {/* Sort buttons */}
            <button
              onClick={() => handleSortToggle('az')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                sortType === 'az'
                  ? 'bg-[#002C4D] text-white shadow-lg'
                  : 'bg-[#00487E] text-white hover:bg-[#69F0FD] hover:text-[#27131D] border border-[#BFC3C7]'
              }`}
            >
              A-Z
            </button>

            <button
              onClick={() => handleSortToggle('distance')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                sortType === 'distance'
                  ? 'bg-[#002C4D] text-white shadow-lg'
                  : 'bg-[#00487E] text-white hover:bg-[#69F0FD] hover:text-[#27131D] border border-[#BFC3C7]'
              }`}
            >
              Distance
            </button>
          </div>

          <div className="mt-2 text-xs text-gray-500">
            {filteredCourts.length}
            {' '}
            {filteredCourts.length === 1 ? 'court' : 'courts'}
            {' '}
            found
            {effectiveSearchQuery && (
              <span className="ml-2">
                matching "
                {effectiveSearchQuery}
                "
              </span>
            )}
          </div>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto ${isMobile ? 'p-2' : 'p-3 sm:p-4'} relative`}>
        <div className={`${isMobile ? 'space-y-2' : 'space-y-3 sm:space-y-4'}`}>
          {filteredCourts.map(court => (
            <div
              key={court.id}
              className={`w-full border rounded-lg hover:bg-gray-50 transition-colors ${isMobile ? 'p-2' : 'p-3 sm:p-4'}`}
            >
              {/* Court info - clickable area */}
              <button
                className="w-full text-left"
                onClick={() => onCourtSelect(court)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onCourtSelect(court);
                  }
                }}
              >
                <h3 className={`font-semibold ${isMobile ? 'text-sm' : 'text-base sm:text-lg'}`}>{court.name}</h3>
                <p className="text-gray-600 text-sm">
                  {court.address}
                  {court.city && `, ${court.city}`}
                  {court.zip && court.zip !== '00000' && `, ${court.zip}`}
                </p>
                <p className="text-gray-600 text-sm">
                  {(() => {
                    const stateAbbreviations: { [key: string]: string } = {
                      Illinois: 'IL',
                      Indiana: 'IN',
                      Wisconsin: 'WI',
                      Michigan: 'MI',
                      Iowa: 'IA',
                      Missouri: 'MO',
                      Ohio: 'OH',
                      Kentucky: 'KY',
                    };
                    return stateAbbreviations[court.state] || court.state;
                  })()}
                </p>
                <div className={`${isMobile ? 'mt-1' : 'mt-2'} flex gap-2 flex-wrap items-center`}>
                  <span className={`px-2 py-1 rounded text-xs sm:text-sm shadow ${court.membership_required ? 'bg-[#EC0037] text-white' : 'bg-[#002C4D] text-white'}`}>
                    {court.membership_required ? 'Private' : 'Public'}
                  </span>
                  {court.lighted && (
                    <span className="px-2 py-1 rounded bg-[#69F0FD] text-[#27131D] text-xs sm:text-sm shadow">
                      Lights
                    </span>
                  )}
                  {Number(court.average_rating) > 0 && Number(court.review_count) > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-current" />
                      <span className="text-xs sm:text-sm text-gray-700">
                        {Number(court.average_rating).toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-500">
                        (
                        {Number(court.review_count)}
                        )
                      </span>
                    </div>
                  )}
                </div>
              </button>

              {/* Directions button - available on both mobile and desktop */}
              <div className="mt-2 pt-2 border-t border-gray-100">
                <a
                  href={getDirectionsUrl(court)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium"
                  onClick={e => e.stopPropagation()}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                  </svg>
                  Get Directions
                </a>
              </div>
            </div>
          ))}
          {filteredCourts.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              No courts found matching your search
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Memoized version of CourtList
const _MemoizedCourtList = React.memo(CourtList);

// Optimized search component with debouncing
const OptimizedSearchBar = React.memo(({
  onSearchChange,
  onToggleList,
  isMobile = false,
}: {
  onSearchChange: (query: string) => void;
  onToggleList: () => void;
  isMobile?: boolean;
}) => {
  const [localQuery, setLocalQuery] = useState('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search to prevent lag
  const debouncedSearch = useCallback((query: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onSearchChange(query);
    }, 150); // 150ms debounce for snappy feel
  }, [onSearchChange]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalQuery(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  const handleClear = useCallback(() => {
    setLocalQuery('');
    onSearchChange('');
  }, [onSearchChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isMobile) {
      onToggleList();
    }
  }, [isMobile, onToggleList]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-2">
      <div className="relative">
        <input
          type="text"
          placeholder="Search by Name, Address, or Zip Code..."
          value={localQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          aria-label="Search tennis courts"
        />
        {localQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
        {isMobile && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
            ↵
          </div>
        )}
      </div>
    </div>
  );
});

// StarRating component for displaying and selecting stars
function StarRating({ value, onChange, editable = false }: { value: number; onChange?: (v: number) => void; editable?: boolean }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          className={`text-2xl ${star <= value ? 'text-yellow-400' : 'text-gray-300'} ${editable ? 'hover:text-yellow-500' : ''}`}
          onClick={editable && onChange ? () => onChange(star) : undefined}
          disabled={!editable}
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ReviewModal for creating/editing reviews
function ReviewModal({
  open,
  onClose,
  onSubmit,
  initialRating = 0,
  initialText = '',
  initialPhotos = [],
  loading = false,
  isEdit = false,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (rating: number, text: string, photos: string[]) => void;
  initialRating?: number;
  initialText?: string;
  initialPhotos?: string[];
  loading?: boolean;
  isEdit?: boolean;
}) {
  const [rating, setRating] = useState(initialRating);
  const [text, setText] = useState(initialText);
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [photoViewerIndex, setPhotoViewerIndex] = useState(0);

  useEffect(() => {
    setRating(initialRating);
    setText(initialText);
    setPhotos(initialPhotos);
  }, [initialRating, initialText, initialPhotos, open]);

  const openPhotoViewer = (photoUrl: string, index: number) => {
    setPhotoViewerIndex(index);
    setPhotoViewerOpen(true);
  };

  const closePhotoViewer = () => {
    setPhotoViewerOpen(false);
  };

  const nextPhoto = () => {
    setPhotoViewerIndex(prev => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setPhotoViewerIndex(prev => (prev - 1 + photos.length) % photos.length);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!photoViewerOpen) {
      return;
    }

    switch (e.key) {
      case 'Escape':
        closePhotoViewer();
        break;
      case 'ArrowLeft':
        if (photos.length > 1) {
          prevPhoto();
        }
        break;
      case 'ArrowRight':
        if (photos.length > 1) {
          nextPhoto();
        }
        break;
    }
  };

  useEffect(() => {
    if (photoViewerOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [photoViewerOpen, photos.length]);

  useEffect(() => {
    if (open) {
      // Hide profile icons when review modal is open
      const profileIcons = document.querySelectorAll('.fixed.top-3.right-3, .fixed.top-20.right-4');
      profileIcons.forEach((icon) => {
        (icon as HTMLElement).style.display = 'none';
      });
    } else {
      // Show profile icons again when review modal is closed
      const profileIcons = document.querySelectorAll('.fixed.top-3.right-3, .fixed.top-20.right-4');
      profileIcons.forEach((icon) => {
        (icon as HTMLElement).style.display = '';
      });
    }

    return () => {
      // Show profile icons again on cleanup
      const profileIcons = document.querySelectorAll('.fixed.top-3.right-3, .fixed.top-20.right-4');
      profileIcons.forEach((icon) => {
        (icon as HTMLElement).style.display = '';
      });
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-[#002C4D] rounded-lg shadow-lg p-6 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto border border-[#BFC3C7]">
        <button className="absolute top-2 right-2 text-[#BFC3C7] hover:text-white transition-colors" onClick={onClose}>&times;</button>
        <h3 className="text-lg font-bold mb-4 text-white">{isEdit ? 'Edit Review' : 'Leave a Review'}</h3>

        <div className="mb-4">
          <StarRating value={rating} onChange={setRating} editable />
        </div>

        <textarea
          className="w-full bg-[#00487E] text-white placeholder-[#7F8B95] border border-[#BFC3C7] rounded-lg p-2 mb-4 min-h-[80px] focus:outline-none focus:border-2 focus:border-[#69F0FD] focus:shadow-[0_0_15px_rgba(105,240,253,0.6),0_0_0_2px_#69F0FD] transition-all"
          placeholder="Share your experience..."
          value={text}
          onChange={e => setText(e.target.value)}
          maxLength={2000}
        />

        <div className="mb-4">
          <PhotoUpload
            onPhotosChange={setPhotos}
            maxPhotos={5}
            className="mb-4"
            initialPhotos={initialPhotos}
            onPhotoClick={openPhotoViewer}
          />
        </div>

        <button
          className="w-full bg-[#EC0037] text-white py-2 rounded-lg font-semibold hover:bg-[#4A1C23] transition-colors disabled:opacity-60 shadow-lg"
          onClick={() => onSubmit(rating, text, photos)}
          disabled={loading || rating < 1}
        >
          {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Submit Review'}
        </button>

        {/* Full-Screen Photo Viewer */}
        {photoViewerOpen && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black bg-opacity-90">
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Close button */}
              <button
                onClick={closePhotoViewer}
                className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 text-2xl font-bold bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center"
              >
                ×
              </button>

              {/* Previous button */}
              {photos.length > 1 && (
                <button
                  onClick={prevPhoto}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:text-gray-300 text-2xl font-bold bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center"
                >
                  ‹
                </button>
              )}

              {/* Next button */}
              {photos.length > 1 && (
                <button
                  onClick={nextPhoto}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:text-gray-300 text-2xl font-bold bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center"
                >
                  ›
                </button>
              )}

              {/* Photo counter */}
              {photos.length > 1 && (
                <div className="absolute top-4 left-4 z-10 text-white bg-black bg-opacity-50 px-3 py-1 rounded text-sm">
                  {photoViewerIndex + 1}
                  {' '}
                  /
                  {photos.length}
                </div>
              )}

              {/* Main photo */}
              <img
                src={photos[photoViewerIndex]}
                alt={`Review ${photoViewerIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CourtDetailsPanel({
  selectedCourt,
  setSelectedCourt,
  isSignedIn,
  userId,
  isAdmin,
  refreshCourtData,
  setShowPhotoUploadModal,
  userSuggestionsRefreshKey,
  setUserSuggestionsRefreshKey,
  _showDeleteCourtModal,
  _setShowDeleteCourtModal,
  _deletingCourt,
  _setDeletingCourt,
  onSetActiveTab,
}: {
  selectedCourt: TennisCourt | null;
  setSelectedCourt: (court: TennisCourt | null) => void;
  isSignedIn: boolean;
  userId?: string;
  isAdmin: boolean;
  refreshCourtData: () => Promise<void>;
  setShowPhotoUploadModal: (show: boolean) => void;
  userSuggestionsRefreshKey: number;
  setUserSuggestionsRefreshKey: (value: number | ((prev: number) => number)) => void;
  _showDeleteCourtModal: boolean;
  _setShowDeleteCourtModal: (show: boolean) => void;
  _deletingCourt: boolean;
  _setDeletingCourt: (deleting: boolean) => void;
  onSetActiveTab?: (tab: 'overview' | 'photos' | 'reviews') => void;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'photos' | 'reviews'>('overview');
  const [reviews, setReviews] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [photosLoaded, setPhotosLoaded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editReview, setEditReview] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [reportReviewId, setReportReviewId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [photoViewerPhotos, setPhotoViewerPhotos] = useState<string[]>([]);
  const [photoViewerIndex, setPhotoViewerIndex] = useState(0);

  // Function to refresh user suggestions
  const refreshUserSuggestions = useCallback(() => {
    setUserSuggestionsRefreshKey(prev => prev + 1);
  }, []);

  // Reset loaded states when court changes
  useEffect(() => {
    if (selectedCourt) {
      setReviewsLoaded(false);
      setPhotosLoaded(false);
      setReviews([]);
      setPhotos([]);
    }
  }, [selectedCourt]);

  // Lazy load reviews only when needed
  const fetchReviews = useCallback(async () => {
    if (!selectedCourt || reviewsLoaded || loadingReviews) {
      return;
    }

    setLoadingReviews(true);
    try {
      const res = await fetch(`/api/tennis-courts/${selectedCourt.id}/reviews-with-approved-photos`);
      let data;
      if (!res.ok) {
        // Fallback to original endpoint if the new one fails
        const fallbackRes = await fetch(`/api/tennis-courts/${selectedCourt.id}/reviews`);
        data = await fallbackRes.json();
      } else {
        data = await res.json();
      }
      setReviews(Array.isArray(data) ? data : []);
      setReviewsLoaded(true);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  }, [selectedCourt, reviewsLoaded, loadingReviews]);

  // Lazy load photos only when needed
  const fetchPhotos = useCallback(async () => {
    if (!selectedCourt || photosLoaded || loadingPhotos) {
      return;
    }

    setLoadingPhotos(true);
    try {
      const res = await fetch(`/api/tennis-courts/${selectedCourt.id}/photos`);
      if (!res.ok) {
        throw new Error('Failed to fetch photos');
      }
      const data = await res.json();
      setPhotos(Array.isArray(data) ? data : []);
      setPhotosLoaded(true);
    } catch (error) {
      console.error('Error fetching photos:', error);
      setPhotos([]);
    } finally {
      setLoadingPhotos(false);
    }
  }, [selectedCourt, photosLoaded, loadingPhotos]);

  const myReview = useMemo(
    () => Array.isArray(reviews) ? reviews.find(r => r.userId === userId) : undefined,
    [reviews, userId],
  );

  // Check if user can edit/delete a review (own review or admin)
  const canEditReview = (review: any) => {
    return isSignedIn && (review.userId === userId || isAdmin);
  };

  const handleSubmit = async (rating: number, text: string, photos: string[]) => {
    if (!selectedCourt) {
      return;
    }
    setModalLoading(true);
    const method = editReview ? 'PUT' : 'POST';
    const body = editReview
      ? { reviewId: editReview.id, rating, text, photos }
      : { rating, text, photos };
    const res = await fetch(`/api/tennis-courts/${selectedCourt.id}/reviews`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      await refreshCourtData(); // Refresh court data (ratings and review counts)

      // Refresh reviews for the current court
      let updated = await fetch(`/api/tennis-courts/${selectedCourt.id}/reviews-with-approved-photos`).then(r => r.json());
      if (!Array.isArray(updated)) {
        // Fallback to original endpoint if the new one fails
        updated = await fetch(`/api/tennis-courts/${selectedCourt.id}/reviews`).then(r => r.json());
      }
      setReviews(updated);

      setShowModal(false);
      setEditReview(null);
    }
    setModalLoading(false);
  };

  const handleDelete = async (reviewId: string) => {
    if (!selectedCourt) {
      return;
    }
    setDeleteConfirmId(reviewId);
  };

  const confirmDelete = async () => {
    if (!selectedCourt || deleteConfirmId === null) {
      return;
    }
    await fetch(`/api/tennis-courts/${selectedCourt.id}/reviews`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewId: deleteConfirmId }),
    });
    await refreshCourtData(); // Refresh court data (ratings and review counts)

    // Refresh reviews for the current court
    let updated = await fetch(`/api/tennis-courts/${selectedCourt.id}/reviews-with-approved-photos`).then(r => r.json());
    if (!Array.isArray(updated)) {
      // Fallback to original endpoint if the new one fails
      updated = await fetch(`/api/tennis-courts/${selectedCourt.id}/reviews`).then(r => r.json());
    }
    setReviews(Array.isArray(updated) ? updated : []);
    setDeleteConfirmId(null);
  };

  const cancelDelete = () => setDeleteConfirmId(null);

  const handleReport = (reviewId: string) => {
    setReportReviewId(reviewId);
  };

  const [reportMessage, setReportMessage] = useState<string | null>(null);
  const [reportMessageType, setReportMessageType] = useState<'success' | 'error'>('success');

  const submitReport = async () => {
    if (!reportReviewId || !reportReason.trim()) {
      return;
    }

    try {
      setSubmittingReport(true);
      const response = await fetch(`/api/tennis-courts/${selectedCourt?.id}/reviews/${reportReviewId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: reportReason.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setReportMessage('Report submitted successfully! Thank you for your feedback.');
        setReportMessageType('success');
      } else {
        // Handle specific error cases with user-friendly messages
        if (response.status === 400 && data.error === 'You have already reported this review') {
          setReportMessage('You have already reported this review. Thank you for your feedback!');
          setReportMessageType('success');
        } else {
          setReportMessage(data.error || 'Failed to submit report. Please try again.');
          setReportMessageType('error');
        }
      }
    } catch (error) {
      console.error('Error reporting review:', error);
      setReportMessage('Failed to submit report. Please check your connection and try again.');
      setReportMessageType('error');
    } finally {
      setSubmittingReport(false);
    }
  };

  const cancelReport = () => {
    setReportReviewId(null);
    setReportReason('');
    setReportMessage(null);
  };

  const handlePhotoDelete = async (photoId: string) => {
    if (!selectedCourt) {
      return;
    }
    try {
      const response = await fetch(`/api/tennis-courts/${selectedCourt.id}/photos`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId }),
      });
      if (response.ok) {
        // Refresh photos
        const photosResponse = await fetch(`/api/tennis-courts/${selectedCourt.id}/photos`);
        if (photosResponse.ok) {
          const photosData = await photosResponse.json();
          setPhotos(Array.isArray(photosData) ? photosData : []);
        }
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  const handlePhotoEdit = async (photoId: string, caption: string) => {
    if (!selectedCourt) {
      return;
    }
    try {
      const response = await fetch(`/api/tennis-courts/${selectedCourt.id}/photos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, caption }),
      });
      if (response.ok) {
        // Refresh photos
        const photosResponse = await fetch(`/api/tennis-courts/${selectedCourt.id}/photos`);
        if (photosResponse.ok) {
          const photosData = await photosResponse.json();
          setPhotos(Array.isArray(photosData) ? photosData : []);
        }
      }
    } catch (error) {
      console.error('Error editing photo:', error);
    }
  };

  // Listen for setActiveTab events
  useEffect(() => {
    const handleSetActiveTab = (event: CustomEvent) => {
      setActiveTab(event.detail.tab);
    };

    window.addEventListener('setActiveTab', handleSetActiveTab as EventListener);
    return () => {
      window.removeEventListener('setActiveTab', handleSetActiveTab as EventListener);
    };
  }, []);

  if (!selectedCourt) {
    return null;
  }
  return (
    <div
      className={
        'fixed z-50 bg-[#002C4D] shadow-2xl border-t border-l border-[#BFC3C7] '
        + 'transition-all duration-300 '
        + 'w-full max-w-lg bottom-0 left-0 right-0 mx-auto rounded-t-xl p-6 '
        + 'lg:static lg:rounded-none lg:border-t-0 lg:border-l lg:w-[400px] lg:max-w-[400px] lg:h-full lg:overflow-y-auto lg:shadow-none lg:p-8 '
        + 'overflow-y-auto overscroll-contain'
      }
      style={{
        height: window.innerWidth < 1024 ? '80vh' : '100%',
        top: window.innerWidth < 1024 ? undefined : 0,
        maxHeight: window.innerWidth < 1024 ? '80vh' : '100%',
      }}
      onWheel={e => e.stopPropagation()}
      onTouchMove={(e) => {
        const target = e.target as HTMLElement;
        const panel = target.closest('[class*="fixed"]');
        if (panel) {
          return;
        }
        e.stopPropagation();
      }}
    >
      <button
        className="absolute top-4 right-4 text-[#BFC3C7] hover:text-white transition-colors"
        onClick={() => setSelectedCourt(null)}
        aria-label="Close details"
      >
        ×
      </button>
      <CourtNameWithSuggestions
        court={selectedCourt}
        isSignedIn={isSignedIn}
        userId={userId}
        onSuggestionReviewed={() => refreshCourtData()}
      />
      <CourtAddressWithSuggestions
        court={selectedCourt}
        isSignedIn={isSignedIn}
        userId={userId}
        onSuggestionReviewed={() => refreshCourtData()}
      />
      <div className="flex items-center space-x-4 mb-4">
        <span className="px-2 py-1 rounded bg-[#00487E] text-white text-xs">
          {selectedCourt.membership_required ? 'Private' : 'Public'}
        </span>
        {selectedCourt.lighted && (
          <span className="px-2 py-1 rounded bg-[#69F0FD] text-[#27131D] text-xs sm:text-sm shadow">
            Lights
          </span>
        )}
      </div>
      <div className="flex space-x-8 border-b mb-4">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview' ? 'border-[#EC0037] text-[#EC0037]' : 'border-transparent text-[#7F8B95] hover:text-[#69F0FD] hover:border-[#69F0FD]'}`}
        >
          Overview
        </button>
        <button
          onClick={() => {
            setActiveTab('photos');
            fetchPhotos();
          }}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'photos' ? 'border-[#EC0037] text-[#EC0037]' : 'border-transparent text-[#7F8B95] hover:text-[#69F0FD] hover:border-[#69F0FD]'}`}
        >
          Photos
        </button>
        <button
          onClick={() => {
            setActiveTab('reviews');
            fetchReviews();
          }}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'reviews' ? 'border-[#EC0037] text-[#EC0037]' : 'border-transparent text-[#7F8B95] hover:text-[#69F0FD] hover:border-[#69F0FD]'}`}
        >
          Reviews
        </button>
      </div>
      {activeTab === 'overview'
        ? (
            <div>
              <InlineCourtInfo
                court={selectedCourt}
                isSignedIn={isSignedIn}
                userId={userId}
                onSuggestionReviewed={() => refreshCourtData()}
              />

              {/* Sign-in prompt for suggestions */}
              {!isSignedIn && (
                <div className="mt-6 pt-4 border-t border-[#BFC3C7]">
                  <div className="text-center text-[#BFC3C7] py-4">
                    <p className="text-sm">Sign in to make a suggestion</p>
                  </div>
                </div>
              )}

              {/* Edit Buttons */}
              {isSignedIn && (
                <div className="mt-6 pt-4 border-t border-[#BFC3C7]">
                  <div className="flex items-center space-x-3">
                    <CourtEditSuggestion
                      court={{
                        id: selectedCourt.id.toString(),
                        name: selectedCourt.name,
                        address: selectedCourt.address,
                        city: selectedCourt.city,
                        zip: selectedCourt.zip,
                        numberOfCourts: selectedCourt.number_of_courts || 1,
                        surfaceType: selectedCourt.surface || '',
                        courtCondition: selectedCourt.court_condition || '',
                        courtType: selectedCourt.court_type || '',
                        hittingWall: selectedCourt.hitting_wall || false,
                        lighted: selectedCourt.lighted || false,
                        isPublic: selectedCourt.is_public !== false,
                      }}
                      userId={userId}
                      onSuggestionSubmitted={() => refreshCourtData()}
                      onSuggestionCreated={() => refreshUserSuggestions()}
                      refreshKey={userSuggestionsRefreshKey}
                    />
                    {isAdmin && (
                      <AdminCourtEdit
                        court={{
                          id: selectedCourt.id.toString(),
                          name: selectedCourt.name,
                          address: selectedCourt.address,
                          city: selectedCourt.city,
                          zip: selectedCourt.zip,
                          numberOfCourts: selectedCourt.number_of_courts || 1,
                          surfaceType: selectedCourt.surface || '',
                          courtCondition: selectedCourt.court_condition || '',
                          courtType: selectedCourt.court_type || '',
                          hittingWall: selectedCourt.hitting_wall || false,
                          lighted: selectedCourt.lighted || false,
                          isPublic: selectedCourt.is_public !== false,
                        }}
                        onCourtUpdated={(updatedCourt) => {
                          // Update the selected court with new data
                          setSelectedCourt({
                            ...selectedCourt,
                            name: updatedCourt.name,
                            address: updatedCourt.address,
                            city: updatedCourt.city,
                            zip: updatedCourt.zip || '',
                            number_of_courts: updatedCourt.numberOfCourts,
                            surface: updatedCourt.surfaceType,
                            court_condition: updatedCourt.courtCondition || '',
                            court_type: updatedCourt.courtType || '',
                            hitting_wall: updatedCourt.hittingWall || false,
                            lighted: updatedCourt.lighted || false,
                            is_public: updatedCourt.isPublic !== false,
                          });
                        }}
                      />
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => _setShowDeleteCourtModal(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-[#EC0037] text-white rounded-lg hover:bg-[#4A1C23] transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Delete Court</span>
                      </button>
                    )}
                  </div>

                  {/* User's Existing Suggestions */}
                  <div className="mt-6">
                    <UserSuggestionDisplay
                      key={userSuggestionsRefreshKey}
                      courtId={selectedCourt.id.toString()}
                      currentUserId={userId || ''}
                      onSuggestionUpdated={() => {
                        refreshCourtData();
                        refreshUserSuggestions();
                      }}
                    />
                  </div>

                  {/* Suggestion History - Admin Only */}
                  {isAdmin && (
                    <div className="mt-6">
                      <AllSuggestionsDisplay
                        courtId={selectedCourt.id.toString()}
                        currentUserId={userId || ''}
                        onSuggestionUpdated={() => refreshCourtData()}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        : activeTab === 'photos'
          ? (
              <div>
                {loadingPhotos
                  ? (
                      <div className="text-center text-[#BFC3C7]">Loading photos...</div>
                    )
                  : (
                      <>
                        {!isSignedIn && (
                          <div className="mb-4 text-center text-[#BFC3C7] py-4">
                            <p className="text-sm">Sign in to post photos</p>
                          </div>
                        )}
                        {isSignedIn && (
                          <div className="mb-4 flex justify-center">
                            <button
                              className="px-4 py-2 bg-[#EC0037] text-white rounded-lg font-semibold hover:bg-[#4A1C23] transition-colors shadow-lg"
                              onClick={() => setShowPhotoUploadModal(true)}
                            >
                              Add Photos
                            </button>
                          </div>
                        )}
                        <CourtPhotoGallery
                          photos={photos}
                          courtId={selectedCourt?.id.toString() || ''}
                          onPhotoDelete={handlePhotoDelete}
                          onPhotoEdit={handlePhotoEdit}
                          isAdmin={isAdmin}
                          currentUserId={userId}
                        />
                      </>
                    )}
              </div>
            )
          : (
              <div>
                {loadingReviews
                  ? (
                      <div className="text-center text-[#BFC3C7]">Loading reviews...</div>
                    )
                  : (
                      <>
                        {reviews.length === 0 && (
                          <div className="text-center text-[#BFC3C7]">No reviews yet.</div>
                        )}
                        {reviews.map(review => (
                          <div key={review.id} className="mb-4 border-b border-[#BFC3C7] pb-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-white">{review.userName}</span>
                              <StarRating value={review.rating} />
                              <span className="text-xs text-[#BFC3C7]">{new Date(review.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="text-[#BFC3C7] text-sm whitespace-pre-line">{review.text}</div>
                            {review.photos && (
                              <div className="mt-2 grid grid-cols-2 gap-2">
                                {JSON.parse(review.photos).map((photo: string, index: number) => (
                                  <button
                                    key={index}
                                    className="w-full aspect-square overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-[#69F0FD] hover:ring-2 hover:ring-[#69F0FD] transition-all"
                                    onClick={() => {
                                      setPhotoViewerPhotos(JSON.parse(review.photos));
                                      setPhotoViewerIndex(index);
                                      setPhotoViewerOpen(true);
                                    }}
                                    aria-label={`View photo ${index + 1}`}
                                    type="button"
                                  >
                                    <img
                                      src={photo}
                                      alt={`${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </button>
                                ))}
                              </div>
                            )}
                            <div className="flex gap-2 mt-2">
                              {canEditReview(review) && (
                                <>
                                  <button
                                    className="text-xs text-[#69F0FD] hover:text-white transition-colors"
                                    onClick={() => {
                                      setEditReview(review);
                                      setShowModal(true);
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="text-xs text-[#EC0037] hover:text-[#4A1C23] transition-colors"
                                    onClick={() => handleDelete(review.id)}
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                              {isSignedIn && (
                                <button
                                  className="text-xs text-[#918AB5] hover:text-white transition-colors"
                                  onClick={() => handleReport(review.id)}
                                >
                                  Report
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                {!isSignedIn && (
                  <div className="mt-6 text-center text-[#BFC3C7] py-4">
                    <p className="text-sm">Sign in to leave a review</p>
                  </div>
                )}
                {isSignedIn && !myReview && (
                  <div className="mt-6 flex justify-center">
                    <button
                      className="px-4 py-2 bg-[#EC0037] text-white rounded-lg font-semibold hover:bg-[#4A1C23] transition-colors shadow-lg"
                      onClick={() => {
                        setEditReview(null);
                        setShowModal(true);
                      }}
                    >
                      Leave a Review
                    </button>
                  </div>
                )}
                {isAdmin && (
                  <div className="mt-2 text-center">
                    <span className="text-xs bg-[#00487E] text-white px-2 py-1 rounded-full">Admin Mode</span>
                  </div>
                )}
                <ReviewModal
                  open={showModal}
                  onClose={() => {
                    setShowModal(false);
                    setEditReview(null);
                  }}
                  onSubmit={handleSubmit}
                  initialRating={editReview ? editReview.rating : myReview ? myReview.rating : 0}
                  initialText={editReview ? editReview.text : myReview ? myReview.text : ''}
                  initialPhotos={editReview ? (editReview.photos ? JSON.parse(editReview.photos) : []) : myReview ? (myReview.photos ? JSON.parse(myReview.photos) : []) : []}
                  loading={modalLoading}
                  isEdit={!!editReview}
                />
                {/* Delete confirmation modal */}
                {deleteConfirmId !== null && (
                  <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs relative">
                      <div className="mb-4 text-center">
                        {isAdmin ? 'Delete this review?' : 'Delete your review?'}
                      </div>
                      <div className="flex gap-2 justify-center">
                        <button className="px-4 py-2 bg-[#EC0037] text-white rounded-lg font-semibold hover:bg-[#4A1C23] transition-colors" onClick={confirmDelete}>Delete</button>
                        <button className="px-4 py-2 bg-[#00487E] text-white rounded-lg font-semibold hover:bg-[#69F0FD] hover:text-[#27131D] transition-colors" onClick={cancelDelete}>Cancel</button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Photo Viewer */}
                <PhotoViewer
                  photos={photoViewerPhotos}
                  initialIndex={photoViewerIndex}
                  isOpen={photoViewerOpen}
                  onClose={() => setPhotoViewerOpen(false)}
                />

                {/* Report Modal */}
                {reportReviewId && (
                  <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black bg-opacity-60">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative border-2 border-gray-200">
                      <h3 className="text-lg font-semibold mb-4">Report Review</h3>

                      {/* Message Display */}
                      {reportMessage && (
                        <div className={`mb-4 p-3 rounded-lg ${
                          reportMessageType === 'success'
                            ? 'bg-green-50 border border-green-200 text-green-800'
                            : 'bg-red-50 border border-red-200 text-red-800'
                        }`}
                        >
                          {reportMessage}
                        </div>
                      )}

                      <div className="mb-4">
                        <label htmlFor="report-reason" className="block text-sm font-medium text-gray-700 mb-2">
                          Reason for report:
                        </label>
                        <textarea
                          id="report-reason"
                          value={reportReason}
                          onChange={e => setReportReason(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#69F0FD] focus:border-[#69F0FD]"
                          rows={4}
                          placeholder="Please explain why you're reporting this review..."
                          maxLength={100}
                          disabled={submittingReport}
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {reportReason.length}
                          /100 characters
                        </div>
                      </div>
                      <div className="flex gap-3 justify-end pt-2 border-t border-gray-200">
                        <button
                          className="px-4 py-2 bg-[#00487E] text-white rounded-lg font-semibold hover:bg-[#69F0FD] hover:text-[#27131D] border border-[#BFC3C7] shadow transition-colors"
                          onClick={cancelReport}
                          disabled={submittingReport}
                          style={{ minWidth: '80px' }}
                        >
                          Cancel
                        </button>
                        <button
                          className="px-4 py-2 bg-[#EC0037] text-white rounded-lg font-semibold hover:bg-[#4A1C23] disabled:opacity-50 disabled:cursor-not-allowed border-2 border-[#4A1C23] shadow-lg transition-colors"
                          onClick={submitReport}
                          disabled={submittingReport || !reportReason.trim()}
                          style={{ minWidth: '120px' }}
                        >
                          {submittingReport ? 'Submitting...' : 'Submit Report'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
    </div>
  );
}

// Place this at the top level, outside MapComponent
function TennisCourtMarkersMapComponent({ courts, handleMarkerClick }: { courts: TennisCourt[]; handleMarkerClick: (courtId: string) => void }) {
  return (
    <>
      {courts.map(court => (
        <Marker
          key={court.id}
          position={[court.latitude, court.longitude]}
          icon={createCustomIcon(court.membership_required)}
          eventHandlers={{
            click: () => handleMarkerClick(court.id),
          }}
        />
      ))}
    </>
  );
}

export default function MapComponent() {
  const { courts, refreshCourtData: refreshGlobalCourtData } = useCourtData();
  const [selectedCourt, setSelectedCourt] = useState<TennisCourt | null>(null);
  const [showCourtList, setShowCourtList] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragCurrentY, setDragCurrentY] = useState(0);
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [photoCaption, setPhotoCaption] = useState('');
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [showPhotoUploadSuccess, setShowPhotoUploadSuccess] = useState(false);
  const [userSuggestionsRefreshKey, setUserSuggestionsRefreshKey] = useState(0);
  const [showNewCourtSuggestionForm, setShowNewCourtSuggestionForm] = useState(false);
  const [showDeleteCourtModal, setShowDeleteCourtModal] = useState(false);
  const [deletingCourt, setDeletingCourt] = useState(false);
  const [showCourtSuggestionSuccess, setShowCourtSuggestionSuccess] = useState(false);
  const mapRef = useRef<any>(null);
  const { isSignedIn, user } = useUser();

  // Mobile detection
  const [_isMobile, _setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      _setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  // Check admin status once on page load
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await fetch('/api/admin/check');
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.isAdmin);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };

    if (isSignedIn) {
      checkAdminStatus();
    }
  }, [isSignedIn]);

  // Add/remove CSS class to body when court details panel is open
  useEffect(() => {
    if (selectedCourt) {
      document.body.classList.add('court-details-open');
    } else {
      document.body.classList.remove('court-details-open');
    }

    // Cleanup function to remove class when component unmounts
    return () => {
      document.body.classList.remove('court-details-open');
    };
  }, [selectedCourt]);

  // Function to refresh individual court data (for updating ratings and review counts)
  const refreshSelectedCourtData = useCallback(async () => {
    if (selectedCourt) {
      try {
        const response = await fetch(`/api/tennis-courts/${selectedCourt.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch court data');
        }
        const updatedCourt = await response.json();
        setSelectedCourt(updatedCourt);

        // Also refresh user suggestions when court data is refreshed
        setUserSuggestionsRefreshKey(prev => prev + 1);
      } catch (error) {
        console.error('Error refreshing court data:', error);
      }
    }
  }, [selectedCourt, setSelectedCourt]);

  // Marker click handler
  const handleMarkerClick = useCallback((courtId: string) => {
    const court = courts.find(c => c.id === courtId) || null;
    setSelectedCourt(court);
    // On mobile, show the details panel as a bottom sheet
    if (window.innerWidth < 1024) {
      setShowCourtList(false);
    }
  }, [courts]);

  // List item click handler
  const handleCourtSelect = useCallback((court: TennisCourt) => {
    setSelectedCourt(court);
    if (mapRef.current) {
      mapRef.current.flyTo(
        [court.latitude, court.longitude],
        15,
        {
          duration: 1.5,
          easeLinearity: 0.25,
          noMoveStart: true,
        },
      );
    }
    // On mobile, hide the court list and show details
    if (window.innerWidth < 1024) {
      setShowCourtList(false);
    }
  }, []);

  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientY = 'touches' in e ? e.touches[0]?.clientY || 0 : e.clientY;
    setDragStartY(clientY);
    setDragCurrentY(clientY);
  }, []);

  // Handle drag move
  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging) {
      return;
    }

    const clientY = 'touches' in e ? e.touches[0]?.clientY || 0 : e.clientY;
    setDragCurrentY(clientY);
  }, [isDragging]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    if (!isDragging) {
      return;
    }

    const dragDistance = dragStartY - dragCurrentY;
    const threshold = 25; // Reduced from 50 to 25 for easier interaction

    if (Math.abs(dragDistance) > threshold) {
      if (dragDistance > 0) {
        // Dragged up - show list
        setShowCourtList(true);
      } else {
        // Dragged down - hide list
        setShowCourtList(false);
      }
    }

    setIsDragging(false);
  }, [isDragging, dragStartY, dragCurrentY]);

  // Add/remove event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchmove', handleDragMove);
      document.addEventListener('touchend', handleDragEnd);

      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
        document.removeEventListener('touchmove', handleDragMove);
        document.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Disable map touch events when details panel is open on mobile
  useEffect(() => {
    if (selectedCourt && window.innerWidth < 1024 && mapRef.current) {
      const map = mapRef.current;
      // Disable map dragging and touch events
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();

      return () => {
        // Re-enable map interactions when details panel closes
        map.dragging.enable();
        map.touchZoom.enable();
        map.doubleClickZoom.enable();
        map.scrollWheelZoom.enable();
      };
    }
  }, [selectedCourt]);

  // Photo upload handler
  const handleSubmitPhotos = async () => {
    if (selectedPhotos.length === 0 || !selectedCourt) {
      return;
    }
    setUploadingPhotos(true);
    try {
      for (const photoUrl of selectedPhotos) {
        const res = await fetch(`/api/tennis-courts/${selectedCourt.id}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoUrl, caption: photoCaption }),
        });
        if (!res.ok) {
          throw new Error('Failed to submit photo');
        }
      }
      setShowPhotoUploadModal(false);
      setSelectedPhotos([]);
      setPhotoCaption('');
      setShowPhotoUploadSuccess(true); // Show success message

      // Set active tab to photos
      handleSetActiveTab('photos');

      // Refresh photos by temporarily changing selectedCourt to trigger re-fetch
      if (selectedCourt) {
        const currentCourt = selectedCourt;
        setSelectedCourt(null);
        setTimeout(() => setSelectedCourt(currentCourt), 100);
      }
    } catch (error) {
      console.error('Error submitting photos:', error);
      // eslint-disable-next-line no-alert
      alert('Failed to submit photos');
    } finally {
      setUploadingPhotos(false);
    }
  };

  // Callback to set photos tab active
  const setPhotosTabActive = useCallback(() => {
    // This will be called from CourtDetailsPanel to set the photos tab active
    // We'll handle this by passing a callback that the panel can call
  }, []);

  // Callback to set active tab
  const handleSetActiveTab = useCallback((tab: 'overview' | 'photos' | 'reviews') => {
    // This will be called from CourtDetailsPanel to set the active tab
    // We'll use a custom event to communicate with the panel
    const event = new CustomEvent('setActiveTab', { detail: { tab } });
    window.dispatchEvent(event);
  }, []);

  return (
    <div className="flex flex-col lg:flex-row h-screen relative">
      {/* Mobile: Search bar at top (Google Maps style) */}
      <div className="lg:hidden absolute top-4 left-4 right-4 z-50">
        <OptimizedSearchBar
          onSearchChange={setMobileSearchQuery}
          onToggleList={() => setShowCourtList(!showCourtList)}
          isMobile={true}
        />
      </div>

      {/* Mobile: Bottom sheet with drag handle (Google Maps style) */}
      <div className={`
        lg:hidden fixed bottom-0 left-0 right-0 z-40
        transform transition-transform duration-300 ease-in-out
        ${showCourtList ? 'translate-y-0' : 'translate-y-full'}
      `}
      >
        <div className="bg-white rounded-t-xl shadow-2xl border-t border-gray-200 max-h-[50vh] relative">
          {/* Close button - positioned at the very top right */}
          <button
            onClick={() => setShowCourtList(false)}
            className="absolute -top-12 right-4 z-50 text-black hover:text-gray-700 p-2 bg-white rounded-full shadow-lg border border-gray-300"
            aria-label="Close court list"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Drag handle - Google Maps style */}
          <button
            className="w-full flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing"
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            aria-label="Drag to resize court list"
          >
            <div className="w-12 h-1 bg-gray-300 rounded-full" />
          </button>

          {/* Court list */}
          <div className="overflow-y-auto max-h-[calc(50vh-20px)]">
            <OptimizedCourtList
              courts={courts}
              onCourtSelect={handleCourtSelect}
              isMobile={true}
              shouldFocus={showCourtList}
              externalSearchQuery={mobileSearchQuery}
              onExternalSearchChange={setMobileSearchQuery}
            />
          </div>
        </div>
      </div>

      {/* Desktop: Sidebar (optimized) */}
      <div className="hidden lg:block w-1/3 border-r border-[#BFC3C7]">
        <OptimizedCourtList
          courts={courts}
          onCourtSelect={handleCourtSelect}
        />
      </div>

      {/* Map Container */}
      <div className="w-full lg:w-2/3 flex-1 relative">
        <MapContainer
          center={CHICAGO_CENTER}
          zoom={11}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
          whenReady={() => {
            if (mapRef.current) {
              mapRef.current.invalidateSize();
            }
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController />
          <TennisCourtMarkersMapComponent courts={courts} handleMarkerClick={handleMarkerClick} />
        </MapContainer>

        {/* Floating "Suggest a Court" Button */}
        {isSignedIn && (
          <button
            onClick={() => setShowNewCourtSuggestionForm(true)}
            className="absolute bottom-6 left-6 z-40 bg-[#EC0037] hover:bg-[#4A1C23] text-white font-medium py-3 px-4 rounded-full shadow-xl transition-colors duration-200 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Suggest a Court</span>
          </button>
        )}

        {/* Details panel: right for desktop, bottom for mobile */}
        {selectedCourt && (
          <div>
            <div className="hidden lg:block fixed top-0 right-0 h-full w-[400px] z-50">
              <CourtDetailsPanel
                selectedCourt={selectedCourt}
                setSelectedCourt={setSelectedCourt}
                isSignedIn={!!isSignedIn}
                userId={typeof user?.id === 'string' ? user.id : undefined}
                isAdmin={isAdmin}
                refreshCourtData={refreshSelectedCourtData}
                setShowPhotoUploadModal={setShowPhotoUploadModal}
                userSuggestionsRefreshKey={userSuggestionsRefreshKey}
                setUserSuggestionsRefreshKey={setUserSuggestionsRefreshKey}
                _showDeleteCourtModal={showDeleteCourtModal}
                _setShowDeleteCourtModal={setShowDeleteCourtModal}
                _deletingCourt={deletingCourt}
                _setDeletingCourt={setDeletingCourt}
                onSetActiveTab={handleSetActiveTab}
              />
            </div>
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
              <CourtDetailsPanel
                selectedCourt={selectedCourt}
                setSelectedCourt={setSelectedCourt}
                isSignedIn={!!isSignedIn}
                userId={typeof user?.id === 'string' ? user.id : undefined}
                isAdmin={isAdmin}
                refreshCourtData={refreshSelectedCourtData}
                setShowPhotoUploadModal={setShowPhotoUploadModal}
                userSuggestionsRefreshKey={userSuggestionsRefreshKey}
                setUserSuggestionsRefreshKey={setUserSuggestionsRefreshKey}
                _showDeleteCourtModal={showDeleteCourtModal}
                _setShowDeleteCourtModal={setShowDeleteCourtModal}
                _deletingCourt={deletingCourt}
                _setDeletingCourt={setDeletingCourt}
                onSetActiveTab={handleSetActiveTab}
              />
            </div>
            <div
              className="lg:hidden fixed inset-0 bg-transparent z-40"
              style={{ pointerEvents: 'none' }}
            />
          </div>
        )}
      </div>

      {/* Photo Upload Modal */}
      {showPhotoUploadModal && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-[#002C4D] rounded-lg shadow-lg p-6 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto border border-[#BFC3C7]">
            <button
              className="absolute top-2 right-2 text-[#BFC3C7] hover:text-white transition-colors"
              onClick={() => setShowPhotoUploadModal(false)}
            >
              &times;
            </button>
            <h3 className="text-lg font-bold mb-4 text-white">Add Photos</h3>

            <div className="mb-4">
              <label htmlFor="photo-caption" className="block text-sm font-medium text-white mb-2">
                Caption
              </label>
              <textarea
                id="photo-caption"
                className="w-full bg-[#00487E] text-white placeholder-[#7F8B95] border border-[#BFC3C7] rounded-lg p-2 focus:outline-none focus:border-2 focus:border-[#69F0FD] focus:shadow-[0_0_15px_rgba(105,240,253,0.6),0_0_0_2px_#69F0FD] transition-all"
                placeholder="Add a caption for your photos..."
                value={photoCaption}
                onChange={e => setPhotoCaption(e.target.value)}
                maxLength={500}
                rows={3}
              />
            </div>

            <CourtPhotoUpload
              onPhotosChange={setSelectedPhotos}
              maxPhotos={10}
              className="mb-4"
              courtId={selectedCourt?.id.toString() || ''}
            />

            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-2 bg-[#EBEDEE] text-[#27131D] rounded-lg font-semibold hover:bg-[#BFC3C7] transition-colors shadow"
                onClick={() => setShowPhotoUploadModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-[#EC0037] text-white rounded-lg font-semibold hover:bg-[#4A1C23] disabled:opacity-60 transition-colors shadow-lg"
                onClick={handleSubmitPhotos}
                disabled={uploadingPhotos || selectedPhotos.length === 0}
              >
                {uploadingPhotos ? 'Uploading...' : 'Upload Photos'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Upload Success Message */}
      {showPhotoUploadSuccess && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-[#002C4D] border-2 border-[#BFC3C7] rounded-lg shadow-lg p-6 max-w-md mx-auto">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 bg-[#69F0FD] rounded-full flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-[#27131D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Photos Uploaded Successfully!</h3>
          </div>
          <p className="text-[#BFC3C7]">Your photos have been added to the court gallery.</p>
          <button
            onClick={() => setShowPhotoUploadSuccess(false)}
            className="mt-4 bg-[#EC0037] text-white px-4 py-2 rounded-lg hover:bg-[#4A1C23] transition-colors"
          >
            Close
          </button>
        </div>
      )}

      {/* Success message for court suggestion */}
      {showCourtSuggestionSuccess && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-[#002C4D] border-2 border-[#BFC3C7] rounded-lg shadow-lg p-6 max-w-md mx-auto">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 bg-[#69F0FD] rounded-full flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-[#27131D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white font-semibold text-lg">Success!</p>
          </div>
          <p className="text-white font-medium mb-1">Your court suggestion has been submitted successfully!</p>
          <p className="text-[#BFC3C7] text-sm">
            Thank you for contributing to our tennis court database. An admin will review your suggestion and you'll be notified of the decision.
          </p>
        </div>
      )}

      {/* New Court Suggestion Form Modal */}
      <NewCourtSuggestionForm
        isOpen={showNewCourtSuggestionForm}
        onClose={() => setShowNewCourtSuggestionForm(false)}
        onSuggestionSubmitted={() => {
          setShowCourtSuggestionSuccess(true);
          setShowNewCourtSuggestionForm(false);
          // Auto-hide success message after 5 seconds
          setTimeout(() => {
            setShowCourtSuggestionSuccess(false);
          }, 5000);
        }}
      />

      {/* Delete Court Confirmation Modal */}
      {showDeleteCourtModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
              onClick={() => setShowDeleteCourtModal(false)}
            >
              &times;
            </button>
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <h3 className="text-lg font-bold text-gray-900">Delete Court</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "
              {selectedCourt?.name}
              "? This action cannot be undone and will remove all associated reviews and photos.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteCourtModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                disabled={deletingCourt}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!selectedCourt || !isAdmin) {
                    return;
                  }
                  setDeletingCourt(true);
                  try {
                    const response = await fetch(`/api/admin/courts/${selectedCourt.id}`, {
                      method: 'DELETE',
                    });
                    if (response.ok) {
                      setShowDeleteCourtModal(false);
                      setSelectedCourt(null);
                      // Force cache invalidation and refresh the entire courts list
                      invalidateCourtCache();
                      await refreshGlobalCourtData();
                    } else {
                      throw new Error('Failed to delete court');
                    }
                  } catch (error) {
                    console.error('Error deleting court:', error);
                    console.error('Failed to delete court. Please try again.');
                  } finally {
                    setDeletingCourt(false);
                  }
                }}
                disabled={deletingCourt}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deletingCourt ? 'Deleting...' : 'Delete Court'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// InlineCourtInfo component for displaying court info with inline suggestions
function InlineCourtInfo({
  court,
  isSignedIn,
  userId,
  onSuggestionReviewed,
}: {
  court: TennisCourt;
  isSignedIn: boolean;
  userId?: string;
  onSuggestionReviewed: () => void;
}) {
  const { pendingSuggestions, loading, refreshSuggestions } = useCourtSuggestions(court.id, userId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewingField, setReviewingField] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  const handleFieldReview = async (suggestion: any, field: string, status: 'approved' | 'rejected') => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tennis-courts/${court.id}/edit-suggestions/${suggestion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          reviewNote: reviewNote || undefined,
          field,
        }),
      });

      if (response.ok) {
        setReviewingField(null);
        setReviewNote('');
        await refreshSuggestions();
        onSuggestionReviewed();
      } else {
        console.error('Failed to review suggestion');
      }
    } catch (error) {
      console.error('Error reviewing suggestion:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldSuggestions = (field: string) => {
    return pendingSuggestions.filter((suggestion) => {
      const suggestedField = `suggested${field.charAt(0).toUpperCase() + field.slice(1)}`;
      const value = suggestion[suggestedField];

      // For boolean fields, check if the value is not null and not undefined
      if (field === 'hittingWall' || field === 'lights' || field === 'isPublic') {
        return value !== null && value !== undefined;
      }

      // For other fields, check if the value exists
      return value;
    });
  };

  const renderFieldWithSuggestions = (field: string, currentValue: any, label: string) => {
    const fieldSuggestions = getFieldSuggestions(field);

    // Format boolean values for display
    const formatValue = (value: any) => {
      if (field === 'hittingWall' || field === 'lights') {
        return value === true ? 'Yes' : value === false ? 'No' : value;
      }
      if (field === 'parking') {
        return value === true || value === 'true' ? 'Yes' : value === false || value === 'false' ? 'No' : value;
      }
      if (field === 'isPublic') {
        return value === true ? 'Public' : value === false ? 'Private' : value;
      }
      if (field === 'courtType') {
        return capitalizeFirstLetter(value);
      }
      if (field === 'state') {
        // Convert full state names to abbreviations
        const stateAbbreviations: { [key: string]: string } = {
          Illinois: 'IL',
          Indiana: 'IN',
          Wisconsin: 'WI',
          Michigan: 'MI',
          Iowa: 'IA',
          Missouri: 'MO',
          Ohio: 'OH',
          Kentucky: 'KY',
        };
        return stateAbbreviations[value] || value;
      }
      return field === 'condition' ? capitalizeFirstLetter(value) : value;
    };

    // Use formatValue for all fields
    const displayValue = formatValue(currentValue);

    return (
      <div className="mb-2">
        <div className="text-sm text-white">
          <strong>
            {label}
            :
          </strong>
          {' '}
          <span className="text-[#BFC3C7]">{displayValue || 'Not specified'}</span>
        </div>
        {fieldSuggestions.map((suggestion) => {
          const suggestedField = `suggested${field.charAt(0).toUpperCase() + field.slice(1)}` as keyof typeof suggestion;
          const suggestedValue = suggestion[suggestedField];

          // For boolean fields, check for null/undefined specifically
          if (field === 'hittingWall' || field === 'lights' || field === 'isPublic') {
            if (suggestedValue === null || suggestedValue === undefined) {
              return null;
            }
          } else {
            // For non-boolean fields, use the original truthy check
            if (!suggestedValue) {
              return null;
            }
          }

          return (
            <div key={suggestion.id} className="ml-4 mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-gray-700">
                    <strong>Suggested:</strong>
                    {' '}
                    {formatValue(suggestedValue)}
                  </p>
                  <p className="text-gray-500 mt-1">
                    by
                    {' '}
                    {suggestion.suggestedByUserName}
                    {' '}
                    on
                    {' '}
                    {new Date(suggestion.createdAt).toLocaleDateString()}
                  </p>
                  {suggestion.reason && suggestion.reason.trim() && (
                    <div className="text-gray-600 mt-1 w-full">
                      <strong>Additional Notes:</strong>
                      <TruncatableText text={suggestion.reason} />
                    </div>
                  )}
                </div>
                {isSignedIn && (
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => setReviewingField(`${suggestion.id}-${field}`)}
                      className="px-2 py-1 text-xs bg-[#002C4D] text-white rounded hover:bg-[#00487E] transition-colors shadow"
                    >
                      Review
                    </button>
                  </div>
                )}
              </div>

              {reviewingField === `${suggestion.id}-${field}` && (
                <div className="mt-2 p-2 bg-white border border-gray-200 rounded">
                  <textarea
                    value={reviewNote}
                    onChange={e => setReviewNote(e.target.value)}
                    placeholder="Add a review note (optional)..."
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 mb-2"
                    rows={2}
                    maxLength={500}
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleFieldReview(suggestion, field, 'approved')}
                      disabled={isSubmitting}
                      className="px-2 py-1 text-xs bg-[#69F0FD] text-[#27131D] rounded hover:bg-[#4DADE3] disabled:opacity-50 transition-colors shadow"
                    >
                      {isSubmitting ? 'Approving...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleFieldReview(suggestion, field, 'rejected')}
                      disabled={isSubmitting}
                      className="px-2 py-1 text-xs bg-[#EC0037] text-white rounded hover:bg-[#4A1C23] disabled:opacity-50 transition-colors shadow"
                    >
                      {isSubmitting ? 'Rejecting...' : 'Reject'}
                    </button>
                    <button
                      onClick={() => {
                        setReviewingField(null);
                        setReviewNote('');
                      }}
                      className="px-2 py-1 text-xs bg-[#7F8B95] text-white rounded hover:bg-[#50394D] transition-colors shadow"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return <div className="text-center text-[#BFC3C7]">Loading...</div>;
  }

  return (
    <div>
      {(court.court_type || getFieldSuggestions('courtType').length > 0) && renderFieldWithSuggestions('courtType', court.court_type, 'Type')}
      {(court.surface || getFieldSuggestions('surface').length > 0) && renderFieldWithSuggestions('surface', court.surface, 'Surface')}
      {court.number_of_courts !== null && court.number_of_courts !== undefined && court.number_of_courts > 0
        && renderFieldWithSuggestions('numberOfCourts', court.number_of_courts, 'Number of Courts')}
      {(court.court_condition || getFieldSuggestions('condition').length > 0) && renderFieldWithSuggestions('condition', court.court_condition, 'Condition')}
      {((court.parking !== null && court.parking !== undefined) || getFieldSuggestions('parking').length > 0) && renderFieldWithSuggestions('parking', court.parking, 'Parking')}
      {renderFieldWithSuggestions('hittingWall', court.hitting_wall, 'Hitting Wall')}
      {getFieldSuggestions('lights').length > 0 && renderFieldWithSuggestions('lights', court.lighted, 'Lights')}
      {(court.is_public !== undefined || getFieldSuggestions('isPublic').length > 0) && renderFieldWithSuggestions('isPublic', court.is_public, 'Court Access')}
    </div>
  );
}

// CourtNameWithSuggestions component for displaying court name with inline suggestions
function CourtNameWithSuggestions({
  court,
  isSignedIn,
  userId,
  onSuggestionReviewed,
}: {
  court: TennisCourt;
  isSignedIn: boolean;
  userId?: string;
  onSuggestionReviewed: () => void;
}) {
  const { pendingSuggestions, loading, refreshSuggestions } = useCourtSuggestions(court.id, userId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewingField, setReviewingField] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  const handleFieldReview = async (suggestion: any, field: string, status: 'approved' | 'rejected') => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tennis-courts/${court.id}/edit-suggestions/${suggestion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          reviewNote: reviewNote || undefined,
          field,
        }),
      });

      if (response.ok) {
        setReviewingField(null);
        setReviewNote('');
        await refreshSuggestions();
        onSuggestionReviewed();
      } else {
        console.error('Failed to review suggestion');
      }
    } catch (error) {
      console.error('Error reviewing suggestion:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nameSuggestions = pendingSuggestions.filter(suggestion => suggestion.suggestedName);

  if (loading) {
    return <h2 className="text-2xl font-bold mb-2 text-white">{court.name}</h2>;
  }

  return (
    <div className="mb-2">
      <h2 className="text-2xl font-bold text-white">{court.name}</h2>
      {nameSuggestions.map(suggestion => (
        <div key={suggestion.id} className="mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-gray-700">
                <strong>Suggested Name:</strong>
                {' '}
                {suggestion.suggestedName}
              </p>
              <p className="text-gray-500 mt-1">
                by
                {' '}
                {suggestion.suggestedByUserName}
                {' '}
                on
                {' '}
                {new Date(suggestion.createdAt).toLocaleDateString()}
              </p>
              {suggestion.reason && suggestion.reason.trim() && (
                <div className="text-gray-600 mt-1 w-full">
                  <strong>Additional Notes:</strong>
                  <TruncatableText text={suggestion.reason} />
                </div>
              )}
            </div>
            {isSignedIn && (
              <div className="flex gap-1 ml-2">
                <button
                  onClick={() => setReviewingField(`${suggestion.id}-name`)}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Review
                </button>
              </div>
            )}
          </div>

          {reviewingField === `${suggestion.id}-name` && (
            <div className="mt-2 p-2 bg-white border border-gray-200 rounded">
              <textarea
                value={reviewNote}
                onChange={e => setReviewNote(e.target.value)}
                placeholder="Add a review note (optional)..."
                className="w-full text-xs border border-gray-300 rounded px-2 py-1 mb-2"
                rows={2}
                maxLength={500}
              />
              <div className="flex gap-1">
                <button
                  onClick={() => handleFieldReview(suggestion, 'name', 'approved')}
                  disabled={isSubmitting}
                  className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Approving...' : 'Approve'}
                </button>
                <button
                  onClick={() => handleFieldReview(suggestion, 'name', 'rejected')}
                  disabled={isSubmitting}
                  className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Rejecting...' : 'Reject'}
                </button>
                <button
                  onClick={() => {
                    setReviewingField(null);
                    setReviewNote('');
                  }}
                  className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// CourtAddressWithSuggestions component for displaying court address with inline suggestions
function CourtAddressWithSuggestions({
  court,
  isSignedIn,
  userId,
  onSuggestionReviewed,
}: {
  court: TennisCourt;
  isSignedIn: boolean;
  userId?: string;
  onSuggestionReviewed: () => void;
}) {
  const { pendingSuggestions, loading, refreshSuggestions } = useCourtSuggestions(court.id, userId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewingField, setReviewingField] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  const handleFieldReview = async (suggestion: any, field: string, status: 'approved' | 'rejected') => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tennis-courts/${court.id}/edit-suggestions/${suggestion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          reviewNote: reviewNote || undefined,
          field,
        }),
      });

      if (response.ok) {
        setReviewingField(null);
        setReviewNote('');
        await refreshSuggestions();
        onSuggestionReviewed();
      } else {
        console.error('Failed to review suggestion');
      }
    } catch (error) {
      console.error('Error reviewing suggestion:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addressSuggestions = pendingSuggestions.filter(suggestion => suggestion.suggestedAddress);
  const citySuggestions = pendingSuggestions.filter(suggestion => suggestion.suggestedCity);
  const stateSuggestions = pendingSuggestions.filter(suggestion => suggestion.suggestedState);
  const zipSuggestions = pendingSuggestions.filter(suggestion => suggestion.suggestedZip && suggestion.suggestedZip !== '00000');

  if (loading) {
    return (
      <div className="text-[#BFC3C7] mb-2">
        {court.address}
        {court.city && `, ${court.city}`}
        {court.zip && court.zip !== '00000' && `, ${court.zip}`}
      </div>
    );
  }

  return (
    <div className="mb-2">
      <div className="text-[#BFC3C7]">
        {court.address}
        {court.city && `, ${court.city}`}
        {court.zip && court.zip !== '00000' && `, ${court.zip}`}
      </div>

      {/* Address suggestions */}
      {addressSuggestions.map(suggestion => (
        <div key={suggestion.id} className="mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-gray-700">
                <strong>Suggested Address:</strong>
                {' '}
                {suggestion.suggestedAddress}
              </p>
              <p className="text-gray-500 mt-1">
                by
                {' '}
                {suggestion.suggestedByUserName}
                {' '}
                on
                {' '}
                {new Date(suggestion.createdAt).toLocaleDateString()}
              </p>
              {suggestion.reason && suggestion.reason.trim() && (
                <div className="text-gray-600 mt-1 w-full">
                  <strong>Additional Notes:</strong>
                  <TruncatableText text={suggestion.reason} />
                </div>
              )}
            </div>
            {isSignedIn && (
              <div className="flex gap-1 ml-2">
                <button
                  onClick={() => setReviewingField(`${suggestion.id}-address`)}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Review
                </button>
              </div>
            )}
          </div>

          {reviewingField === `${suggestion.id}-address` && (
            <div className="mt-2 p-2 bg-white border border-gray-200 rounded">
              <textarea
                value={reviewNote}
                onChange={e => setReviewNote(e.target.value)}
                placeholder="Add a review note (optional)..."
                className="w-full text-xs border border-gray-300 rounded px-2 py-1 mb-2"
                rows={2}
                maxLength={500}
              />
              <div className="flex gap-1">
                <button
                  onClick={() => handleFieldReview(suggestion, 'address', 'approved')}
                  disabled={isSubmitting}
                  className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Approving...' : 'Approve'}
                </button>
                <button
                  onClick={() => handleFieldReview(suggestion, 'address', 'rejected')}
                  disabled={isSubmitting}
                  className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Rejecting...' : 'Reject'}
                </button>
                <button
                  onClick={() => {
                    setReviewingField(null);
                    setReviewNote('');
                  }}
                  className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* City suggestions */}
      {citySuggestions.map(suggestion => (
        <div key={suggestion.id} className="mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-gray-700">
                <strong>Suggested City:</strong>
                {' '}
                {suggestion.suggestedCity}
              </p>
              <p className="text-gray-500 mt-1">
                by
                {' '}
                {suggestion.suggestedByUserName}
                {' '}
                on
                {' '}
                {new Date(suggestion.createdAt).toLocaleDateString()}
              </p>
              {suggestion.reason && suggestion.reason.trim() && (
                <div className="text-gray-600 mt-1 w-full">
                  <strong>Additional Notes:</strong>
                  <TruncatableText text={suggestion.reason} />
                </div>
              )}
            </div>
            {isSignedIn && (
              <div className="flex gap-1 ml-2">
                <button
                  onClick={() => setReviewingField(`${suggestion.id}-city`)}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Review
                </button>
              </div>
            )}
          </div>

          {reviewingField === `${suggestion.id}-city` && (
            <div className="mt-2 p-2 bg-white border border-gray-200 rounded">
              <textarea
                value={reviewNote}
                onChange={e => setReviewNote(e.target.value)}
                placeholder="Add a review note (optional)..."
                className="w-full text-xs border border-gray-300 rounded px-2 py-1 mb-2"
                rows={2}
                maxLength={500}
              />
              <div className="flex gap-1">
                <button
                  onClick={() => handleFieldReview(suggestion, 'city', 'approved')}
                  disabled={isSubmitting}
                  className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Approving...' : 'Approve'}
                </button>
                <button
                  onClick={() => handleFieldReview(suggestion, 'city', 'rejected')}
                  disabled={isSubmitting}
                  className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Rejecting...' : 'Reject'}
                </button>
                <button
                  onClick={() => {
                    setReviewingField(null);
                    setReviewNote('');
                  }}
                  className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* State suggestions */}
      {stateSuggestions.map(suggestion => (
        <div key={suggestion.id} className="mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-gray-700">
                <strong>Suggested State:</strong>
                {' '}
                {capitalizeFirstLetter(suggestion.suggestedState)}
              </p>
              <p className="text-gray-500 mt-1">
                by
                {' '}
                {suggestion.suggestedByUserName}
                {' '}
                on
                {' '}
                {new Date(suggestion.createdAt).toLocaleDateString()}
              </p>
              {suggestion.reason && suggestion.reason.trim() && (
                <div className="text-gray-600 mt-1 w-full">
                  <strong>Additional Notes:</strong>
                  <TruncatableText text={suggestion.reason} />
                </div>
              )}
            </div>
            {isSignedIn && (
              <div className="flex gap-1 ml-2">
                <button
                  onClick={() => setReviewingField(`${suggestion.id}-state`)}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Review
                </button>
              </div>
            )}
          </div>

          {reviewingField === `${suggestion.id}-state` && (
            <div className="mt-2 p-2 bg-white border border-gray-200 rounded">
              <textarea
                value={reviewNote}
                onChange={e => setReviewNote(e.target.value)}
                placeholder="Add a review note (optional)..."
                className="w-full text-xs border border-gray-300 rounded px-2 py-1 mb-2"
                rows={2}
                maxLength={500}
              />
              <div className="flex gap-1">
                <button
                  onClick={() => handleFieldReview(suggestion, 'state', 'approved')}
                  disabled={isSubmitting}
                  className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Approving...' : 'Approve'}
                </button>
                <button
                  onClick={() => handleFieldReview(suggestion, 'state', 'rejected')}
                  disabled={isSubmitting}
                  className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Rejecting...' : 'Reject'}
                </button>
                <button
                  onClick={() => {
                    setReviewingField(null);
                    setReviewNote('');
                  }}
                  className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Zip suggestions */}
      {zipSuggestions.map(suggestion => (
        <div key={suggestion.id} className="mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-gray-700">
                <strong>Suggested Zip:</strong>
                {' '}
                {suggestion.suggestedZip}
              </p>
              <p className="text-gray-500 mt-1">
                by
                {' '}
                {suggestion.suggestedByUserName}
                {' '}
                on
                {' '}
                {new Date(suggestion.createdAt).toLocaleDateString()}
              </p>
              {suggestion.reason && suggestion.reason.trim() && (
                <div className="text-gray-600 mt-1 w-full">
                  <strong>Additional Notes:</strong>
                  <TruncatableText text={suggestion.reason} />
                </div>
              )}
            </div>
            {isSignedIn && (
              <div className="flex gap-1 ml-2">
                <button
                  onClick={() => setReviewingField(`${suggestion.id}-zip`)}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Review
                </button>
              </div>
            )}
          </div>

          {reviewingField === `${suggestion.id}-zip` && (
            <div className="mt-2 p-2 bg-white border border-gray-200 rounded">
              <textarea
                value={reviewNote}
                onChange={e => setReviewNote(e.target.value)}
                placeholder="Add a review note (optional)..."
                className="w-full text-xs border border-gray-300 rounded px-2 py-1 mb-2"
                rows={2}
                maxLength={500}
              />
              <div className="flex gap-1">
                <button
                  onClick={() => handleFieldReview(suggestion, 'zip', 'approved')}
                  disabled={isSubmitting}
                  className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Approving...' : 'Approve'}
                </button>
                <button
                  onClick={() => handleFieldReview(suggestion, 'zip', 'rejected')}
                  disabled={isSubmitting}
                  className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Rejecting...' : 'Reject'}
                </button>
                <button
                  onClick={() => {
                    setReviewingField(null);
                    setReviewNote('');
                  }}
                  className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// TruncatableText component for handling long text with expand/collapse functionality
function TruncatableText({ text, maxLength = 100 }: { text: string; maxLength?: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (text.length <= maxLength) {
    return (
      <div className="mt-1 break-words whitespace-pre-wrap overflow-hidden w-full">
        {text}
      </div>
    );
  }

  return (
    <div className="mt-1 w-full">
      <div className="break-words whitespace-pre-wrap overflow-hidden w-full">
        {isExpanded ? text : `${text.substring(0, maxLength)}...`}
      </div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-blue-600 hover:text-blue-800 text-xs mt-1 underline"
      >
        {isExpanded ? 'Show less' : 'Show more'}
      </button>
    </div>
  );
}
