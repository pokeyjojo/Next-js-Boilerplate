'use client';

import type { TennisCourt } from '@/hooks/useCourtData';
import { useEffect, useRef } from 'react';

import { useGoogleMap } from './GoogleMap';

// Map controller to handle initial positioning
export function GoogleMapController() {
  const map = useGoogleMap();

  useEffect(() => {
    if (map) {
      const CHICAGO_CENTER = { lat: 41.8781, lng: -87.6298 };
      map.setCenter(CHICAGO_CENTER);
      map.setZoom(11);
    }
  }, [map]);

  return null;
}

// Map controller to handle zoom and bounds changes for filtered courts
export function GoogleMapZoomController({
  filteredCourts,
  searchQuery,
}: {
  filteredCourts: TennisCourt[];
  searchQuery: string;
}) {
  const map = useGoogleMap();
  const hasSearchedRef = useRef(false);
  const previousSearchQueryRef = useRef(searchQuery);

  useEffect(() => {
    if (!map) {
      return;
    }

    // Track if user has ever performed a search
    if (searchQuery && searchQuery.trim()) {
      hasSearchedRef.current = true;
    }

    // Only handle search-related zoom changes
    if (searchQuery && searchQuery.trim()) {
      if (filteredCourts.length === 0) {
        // No results found - keep current view but don't change zoom
      } else if (filteredCourts.length === 1) {
        // Single court - zoom to it
        const court = filteredCourts[0];
        if (court) {
          map.setCenter({ lat: court.latitude, lng: court.longitude });
          map.setZoom(16);
        }
      } else {
        // Multiple courts - fit bounds
        const bounds = new google.maps.LatLngBounds();
        filteredCourts.forEach((court) => {
          bounds.extend({ lat: court.latitude, lng: court.longitude });
        });
        map.fitBounds(bounds);

        // Add some padding
        const padding = 50;
        map.fitBounds(bounds, padding);
      }
    } else if (hasSearchedRef.current && previousSearchQueryRef.current && !searchQuery) {
      // User has cleared a previous search - reset to default view
      const CHICAGO_CENTER = { lat: 41.8781, lng: -87.6298 };
      map.setCenter(CHICAGO_CENTER);
      map.setZoom(11);
    }

    previousSearchQueryRef.current = searchQuery;
  }, [map, filteredCourts, searchQuery]);

  return null;
}

// Map controller to handle zooming to externally selected courts (e.g., from Meet in the Middle)
export function GoogleMapExternalCourtController({
  selectedCourt,
}: {
  selectedCourt: TennisCourt | null;
}) {
  const map = useGoogleMap();
  const previousCourtRef = useRef<TennisCourt | null>(null);

  useEffect(() => {
    if (!map || !selectedCourt) {
      return;
    }

    // Only zoom if this is a different court than the previous one
    const isDifferentCourt = !previousCourtRef.current
      || previousCourtRef.current.id !== selectedCourt.id;

    if (isDifferentCourt) {
      // Zoom to the selected court
      map.setCenter({ lat: selectedCourt.latitude, lng: selectedCourt.longitude });
      map.setZoom(16);

      // Update the reference
      previousCourtRef.current = selectedCourt;
    }
  }, [map, selectedCourt]);

  return null;
}
