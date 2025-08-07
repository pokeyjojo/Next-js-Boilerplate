'use client';

import { useEffect } from 'react';
import type { TennisCourt } from '@/hooks/useCourtData';
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

  useEffect(() => {
    if (!map) return;

    if (searchQuery && filteredCourts.length > 0) {
      if (filteredCourts.length === 1) {
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
    }
  }, [map, filteredCourts, searchQuery]);

  return null;
}


