'use client';

import type { TennisCourt } from '@/hooks/useCourtData';

import { useEffect, useRef } from 'react';

import { useGoogleMap } from './GoogleMap';

export function GoogleMapDirectMarkers({
  courts,
  handleMarkerClick,
}: {
  courts: TennisCourt[];
  handleMarkerClick: (courtId: string) => void;
}) {
  const map = useGoogleMap();
  const markersRef = useRef<google.maps.Marker[]>([]);
  const currentMapRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    if (!map || !courts || courts.length === 0) {
      return;
    }

    // Wait for map to be fully ready
    const waitForMapReady = () => {
      return new Promise<void>((resolve) => {
        if (map.getCenter() && map.getZoom()) {
          resolve();
        } else {
          const checkReady = () => {
            if (map.getCenter() && map.getZoom()) {
              resolve();
            } else {
              setTimeout(checkReady, 100);
            }
          };
          checkReady();
        }
      });
    };

    // If it's the same map and we already have markers, don't recreate them
    if (map === currentMapRef.current && markersRef.current.length > 0) {
      return;
    }

    // Clean up existing markers if we have a different map
    if (markersRef.current.length > 0) {
      markersRef.current.forEach((marker) => {
        try {
          marker.setMap(null);
        } catch {
          // Silently handle cleanup errors
        }
      });
      markersRef.current = [];
    }

    currentMapRef.current = map;

    const createMarkers = async () => {
      await waitForMapReady();

      courts.forEach((court) => {
        try {
          const lat = typeof court.latitude === 'string' ? Number.parseFloat(court.latitude) : court.latitude;
          const lng = typeof court.longitude === 'string' ? Number.parseFloat(court.longitude) : court.longitude;

          if (Number.isNaN(lat) || Number.isNaN(lng) || lat === 0 || lng === 0) {
            return;
          }

          const isPrivate = court.is_public !== undefined ? !court.is_public : court.membership_required;

          const marker = new google.maps.Marker({
            position: { lat, lng },
            map,
            title: court.name,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: isPrivate ? '#EC0037' : '#002C4D',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
            },
          });

          marker.addListener('click', () => {
            handleMarkerClick(court.id.toString());
          });

          markersRef.current.push(marker);
        } catch (error) {
          console.error(`Error creating marker for court ${court.name}:`, error);
        }
      });
    };

    createMarkers();

    // Cleanup function - only run when component unmounts or map changes
    return () => {
      // Don't clean up if we're just re-running useEffect with the same map
      if (map === currentMapRef.current) {
        return;
      }

      markersRef.current.forEach((marker) => {
        try {
          marker.setMap(null);
        } catch {
          // Silently handle cleanup errors
        }
      });
      markersRef.current = [];
    };
  }, [map, courts, handleMarkerClick]);

  return null;
}
