'use client';

import type { TennisCourt } from '@/hooks/useCourtData';
import { useEffect, useRef, useMemo, useCallback } from 'react';
import { useGoogleMap } from './GoogleMap';

// Optimized icon cache with reduced complexity
const createSimpleIcons = () => ({
  public: {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 5,
    fillColor: '#002C4D',
    fillOpacity: 1,
    strokeColor: '#FFFFFF',
    strokeWeight: 1,
  },
  private: {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 5,
    fillColor: '#EC0037',
    fillOpacity: 1,
    strokeColor: '#FFFFFF',
    strokeWeight: 1,
  },
});

export function ViewportBasedMarkers({
  courts,
  handleMarkerClick,
  maxVisibleMarkers = 200,
}: {
  courts: TennisCourt[];
  handleMarkerClick: (courtId: string) => void;
  maxVisibleMarkers?: number;
}) {
  const map = useGoogleMap();
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const iconsRef = useRef<any>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize icons once
  useEffect(() => {
    if (window.google && !iconsRef.current) {
      iconsRef.current = createSimpleIcons();
    }
  }, []);

  // Memoize valid courts to avoid reprocessing
  const validCourts = useMemo(() => {
    return courts.filter(court => {
      const lat = typeof court.latitude === 'string' ? Number.parseFloat(court.latitude) : court.latitude;
      const lng = typeof court.longitude === 'string' ? Number.parseFloat(court.longitude) : court.longitude;
      return !Number.isNaN(lat) && !Number.isNaN(lng) && lat !== 0 && lng !== 0;
    }).map(court => ({
      ...court,
      lat: typeof court.latitude === 'string' ? Number.parseFloat(court.latitude) : court.latitude,
      lng: typeof court.longitude === 'string' ? Number.parseFloat(court.longitude) : court.longitude,
    }));
  }, [courts]);

  // Optimized function to get visible courts
  const getVisibleCourts = useCallback(() => {
    if (!map || !validCourts.length) return [];

    const bounds = map.getBounds();
    if (!bounds) return [];

    const zoom = map.getZoom() || 10;
    const maxMarkers = zoom > 13 ? maxVisibleMarkers : Math.min(maxVisibleMarkers, 100);

    const visibleCourts = validCourts.filter(court => 
      bounds.contains(new google.maps.LatLng(court.lat, court.lng))
    );

    // If too many markers, prioritize by distance from center
    if (visibleCourts.length > maxMarkers) {
      const center = bounds.getCenter();
      return visibleCourts
        .map(court => ({
          ...court,
          distance: google.maps.geometry.spherical.computeDistanceBetween(
            center,
            new google.maps.LatLng(court.lat, court.lng)
          ),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, maxMarkers);
    }

    return visibleCourts;
  }, [map, validCourts, maxVisibleMarkers]);

  // Debounced update function
  const updateMarkers = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      if (!map || !iconsRef.current) return;

      const visibleCourts = getVisibleCourts();
      const visibleCourtIds = new Set(visibleCourts.map(court => court.id.toString()));

      // Remove markers that are no longer visible
      markersRef.current.forEach((marker, courtId) => {
        if (!visibleCourtIds.has(courtId)) {
          marker.setMap(null);
          markersRef.current.delete(courtId);
        }
      });

      // Add markers for newly visible courts
      visibleCourts.forEach(court => {
        const courtId = court.id.toString();
        
        if (!markersRef.current.has(courtId)) {
          const isPrivate = court.is_public !== undefined ? !court.is_public : court.membership_required;
          
          const marker = new google.maps.Marker({
            position: { lat: court.lat, lng: court.lng },
            map,
            title: court.name,
            icon: isPrivate ? iconsRef.current.private : iconsRef.current.public,
            optimized: true,
          });

          marker.addListener('click', () => {
            handleMarkerClick(courtId);
          });

          markersRef.current.set(courtId, marker);
        }
      });
    }, 100); // 100ms debounce
  }, [map, getVisibleCourts, handleMarkerClick]);

  // Listen to map events
  useEffect(() => {
    if (!map) return;

    const handleMapUpdate = () => updateMarkers();

    // Initial render
    updateMarkers();

    // Listen to map events
    map.addListener('bounds_changed', handleMapUpdate);
    map.addListener('zoom_changed', handleMapUpdate);

    return () => {
      google.maps.event.clearListeners(map, 'bounds_changed');
      google.maps.event.clearListeners(map, 'zoom_changed');
      
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [map, updateMarkers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current.clear();
      
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return null;
}
