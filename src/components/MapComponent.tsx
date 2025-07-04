'use client';

import type { LatLngTuple } from 'leaflet';
import { useUser } from '@clerk/nextjs';
import L from 'leaflet';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const CHICAGO_CENTER: LatLngTuple = [41.8781, -87.6298];

type TennisCourt = {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude: number;
  longitude: number;
  lighted: boolean;
  membership_required: boolean;
  court_type: string;
  hitting_wall: boolean;
  court_condition: string;
  number_of_courts: number;
  surface: string;
  parking: string;
};

// Custom marker icons for public and private courts
const createCustomIcon = (isPrivate: boolean) => {
  const color = isPrivate ? '#FF4444' : '#3388FF';
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 10px rgba(0,0,0,0.3);
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
  const [courts, setCourts] = useState<TennisCourt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCourts = async () => {
      try {
        const response = await fetch('/api/courts');
        if (!response.ok) {
          throw new Error('Failed to fetch tennis courts');
        }
        const data = await response.json();
        setCourts(data);
      } catch (err) {
        console.error('Error fetching courts:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCourts();
  }, []);

  const handleMarkerClick = (courtId: number) => {
    router.push(`/en/courts/${courtId}`);
  };

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
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              A-Z
            </button>

            <button
              onClick={() => handleSortToggle('distance')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                sortType === 'distance'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              A-Z
            </button>

            <button
              onClick={() => handleSortToggle('distance')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                sortType === 'distance'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                <p className="text-gray-600 text-sm">{court.address}</p>
                <p className="text-gray-600 text-sm">
                  {court.city}
                  {', '}
                  {court.state}
                </p>
                <div className={`${isMobile ? 'mt-1' : 'mt-2'} flex gap-2 flex-wrap`}>
                  <span className={`px-2 py-1 rounded text-xs sm:text-sm ${court.membership_required ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                    {court.membership_required ? 'Private' : 'Public'}
                  </span>
                  {court.lighted && (
                    <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-xs sm:text-sm">
                      Lights
                    </span>
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
const MemoizedCourtList = React.memo(CourtList);

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
  loading = false,
  isEdit = false,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (rating: number, text: string) => void;
  initialRating?: number;
  initialText?: string;
  loading?: boolean;
  isEdit?: boolean;
}) {
  const [rating, setRating] = useState(initialRating);
  const [text, setText] = useState(initialText);
  useEffect(() => {
    setRating(initialRating);
    setText(initialText);
  }, [initialRating, initialText, open]);
  if (!open) {
    return null;
  }
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={onClose}>&times;</button>
        <h3 className="text-lg font-bold mb-4">{isEdit ? 'Edit Review' : 'Leave a Review'}</h3>
        <div className="mb-4">
          <StarRating value={rating} onChange={setRating} editable />
        </div>
        <textarea
          className="w-full border rounded-lg p-2 mb-4 min-h-[80px]"
          placeholder="Share your experience..."
          value={text}
          onChange={e => setText(e.target.value)}
          maxLength={2000}
        />
        <button
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
          onClick={() => onSubmit(rating, text)}
          disabled={loading || rating < 1}
        >
          {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Submit Review'}
        </button>
      </div>
    </div>
  );
}

function CourtDetailsPanel({ selectedCourt, setSelectedCourt, isSignedIn, userId }: {
  selectedCourt: TennisCourt | null;
  setSelectedCourt: (court: TennisCourt | null) => void;
  isSignedIn: boolean;
  userId?: string;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews'>('overview');
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editReview, setEditReview] = useState<any | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedCourt) {
      return;
    }
    setLoadingReviews(true);
    fetch(`/api/tennis-courts/${selectedCourt.id}/reviews`)
      .then(res => res.json())
      .then(data => setReviews(Array.isArray(data) ? data : []))
      .finally(() => setLoadingReviews(false));
  }, [selectedCourt]);

  const myReview = useMemo(
    () => Array.isArray(reviews) ? reviews.find(r => r.userId === userId) : undefined,
    [reviews, userId],
  );

  const handleSubmit = async (rating: number, text: string) => {
    if (!selectedCourt) {
      return;
    }
    setModalLoading(true);
    const method = editReview ? 'PUT' : 'POST';
    const body = editReview
      ? { reviewId: editReview.id, rating, text }
      : { rating, text };
    const res = await fetch(`/api/tennis-courts/${selectedCourt.id}/reviews`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const updated = await fetch(`/api/tennis-courts/${selectedCourt.id}/reviews`).then(r => r.json());
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
    const updated = await fetch(`/api/tennis-courts/${selectedCourt.id}/reviews`).then(r => r.json());
    setReviews(Array.isArray(updated) ? updated : []);
    setDeleteConfirmId(null);
  };

  const cancelDelete = () => setDeleteConfirmId(null);

  if (!selectedCourt) {
    return null;
  }
  return (
    <div
      className={
        'fixed z-50 bg-white shadow-2xl border-t border-l border-gray-200 '
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
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
        onClick={() => setSelectedCourt(null)}
        aria-label="Close details"
      >
        ×
      </button>
      <h2 className="text-2xl font-bold mb-2">{selectedCourt.name}</h2>
      <div className="text-gray-600 mb-2">
        {selectedCourt.address}
        ,
        {selectedCourt.city}
      </div>
      <div className="flex items-center space-x-4 mb-4">
        <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs">
          {selectedCourt.membership_required ? 'Private' : 'Public'}
        </span>
        {selectedCourt.lighted && (
          <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-xs">Lights</span>
        )}
      </div>
      <div className="flex space-x-8 border-b mb-4">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'reviews' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          Reviews
        </button>
      </div>
      {activeTab === 'overview'
        ? (
            <div>
              {selectedCourt.court_type && (
                <div className="mb-2">
                  <strong>Type:</strong>
                  {' '}
                  {selectedCourt.court_type}
                </div>
              )}
              {selectedCourt.surface && (
                <div className="mb-2">
                  <strong>Surface:</strong>
                  {' '}
                  {selectedCourt.surface}
                </div>
              )}
              {selectedCourt.number_of_courts !== null && selectedCourt.number_of_courts !== undefined && selectedCourt.number_of_courts > 0 && (
                <div className="mb-2">
                  <strong>Number of Courts:</strong>
                  {' '}
                  {selectedCourt.number_of_courts}
                </div>
              )}
              {selectedCourt.court_condition && (
                <div className="mb-2">
                  <strong>Condition:</strong>
                  {' '}
                  {selectedCourt.court_condition}
                </div>
              )}
              {selectedCourt.parking && (
                <div className="mb-2">
                  <strong>Parking:</strong>
                  {' '}
                  {selectedCourt.parking}
                </div>
              )}
              <div className="mb-2">
                <strong>Hitting Wall:</strong>
                {' '}
                {selectedCourt.hitting_wall ? 'Yes' : 'No'}
              </div>
            </div>
          )
        : (
            <div>
              {loadingReviews
                ? (
                    <div className="text-center text-gray-400">Loading reviews...</div>
                  )
                : (
                    <>
                      {reviews.length === 0 && (
                        <div className="text-center text-gray-400">No reviews yet.</div>
                      )}
                      {reviews.map(review => (
                        <div key={review.id} className="mb-4 border-b pb-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{review.userName}</span>
                            <StarRating value={review.rating} />
                            <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="text-gray-700 text-sm whitespace-pre-line">{review.text}</div>
                          {userId && review.userId === userId && (
                            <div className="flex gap-2 mt-2">
                              <button
                                className="text-xs text-blue-600 hover:underline"
                                onClick={() => {
                                  setEditReview(review);
                                  setShowModal(true);
                                }}
                              >
                                Edit
                              </button>
                              <button
                                className="text-xs text-red-600 hover:underline"
                                onClick={() => handleDelete(review.id)}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  )}
              {isSignedIn && (
                <div className="mt-6 flex justify-center">
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow"
                    onClick={() => {
                      setEditReview(null);
                      setShowModal(true);
                    }}
                  >
                    {myReview ? 'Edit Your Review' : 'Leave a Review'}
                  </button>
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
                loading={modalLoading}
                isEdit={!!editReview}
              />
              {/* Delete confirmation modal */}
              {deleteConfirmId !== null && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs relative">
                    <div className="mb-4 text-center">Delete your review?</div>
                    <div className="flex gap-2 justify-center">
                      <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700" onClick={confirmDelete}>Delete</button>
                      <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300" onClick={cancelDelete}>Cancel</button>
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
function TennisCourtMarkersMapComponent({ courts, handleMarkerClick }: { courts: TennisCourt[]; handleMarkerClick: (courtId: number) => void }) {
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
  const [courts, setCourts] = useState<TennisCourt[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<TennisCourt | null>(null);
  const [showCourtList, setShowCourtList] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragCurrentY, setDragCurrentY] = useState(0);
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const mapRef = useRef<any>(null);
  const { isSignedIn, user } = useUser();

  useEffect(() => {
    const fetchCourts = async () => {
      try {
        const response = await fetch('/api/courts');
        if (!response.ok) {
          throw new Error('Failed to fetch tennis courts');
        }
        const data = await response.json();
        setCourts(data);
      } catch (err) {
        console.error('Error fetching courts:', err);
      }
    };
    fetchCourts();
  }, []);

  // Marker click handler
  const handleMarkerClick = useCallback((courtId: number) => {
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
            <MemoizedCourtList
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

      {/* Desktop: Sidebar (unchanged) */}
      <div className="hidden lg:block w-1/3 border-r">
        <CourtList
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
        {/* Details panel: right for desktop, bottom for mobile */}
        {selectedCourt && (
          <div>
            <div className="hidden lg:block fixed top-0 right-0 h-full w-[400px] z-50">
              <CourtDetailsPanel
                selectedCourt={selectedCourt}
                setSelectedCourt={setSelectedCourt}
                isSignedIn={!!isSignedIn}
                userId={typeof user?.id === 'string' ? user.id : undefined}
              />
            </div>
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
              <CourtDetailsPanel
                selectedCourt={selectedCourt}
                setSelectedCourt={setSelectedCourt}
                isSignedIn={!!isSignedIn}
                userId={typeof user?.id === 'string' ? user.id : undefined}
              />
            </div>
            <div
              className="lg:hidden fixed inset-0 bg-transparent z-40"
              style={{ pointerEvents: 'none' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
