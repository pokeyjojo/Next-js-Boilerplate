'use client';

import type { TennisCourt } from '@/hooks/useCourtData';
import { useEffect, useRef } from 'react';
import { useGoogleMap } from './GoogleMap';

// Import MarkerClusterer with proper error handling
let MarkerClusterer: any = null;

// Dynamically import the marker clusterer to avoid SSR issues
const initMarkerClusterer = async () => {
  if (typeof window !== 'undefined' && !MarkerClusterer) {
    try {
      const module = await import('@googlemaps/markerclusterer');
      MarkerClusterer = module.MarkerClusterer;
    } catch (error) {
      console.error('Failed to load MarkerClusterer:', error);
    }
  }
};

// Pre-create optimized marker icons
const createOptimizedIcons = () => {
  return {
    public: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 6,
      fillColor: '#002C4D',
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: 1,
    },
    private: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 6,
      fillColor: '#EC0037',
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: 1,
    },
  };
};

export function OptimizedMarkerClusterer({
  courts,
  handleMarkerClick,
  enableClustering = true,
}: {
  courts: TennisCourt[];
  handleMarkerClick: (courtId: string) => void;
  enableClustering?: boolean;
}) {
  const map = useGoogleMap();
  const clustererRef = useRef<any>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const iconsRef = useRef<any>(null);

  // Initialize icons once
  useEffect(() => {
    if (window.google && !iconsRef.current) {
      iconsRef.current = createOptimizedIcons();
    }
  }, []);

  // Initialize MarkerClusterer
  useEffect(() => {
    initMarkerClusterer();
  }, []);

  useEffect(() => {
    if (!map || !MarkerClusterer || !iconsRef.current || courts.length === 0) {
      return;
    }

    // Clear existing markers and clusterer
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
      clustererRef.current = null;
    }
    
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Create markers efficiently
    const newMarkers = courts
      .filter(court => {
        const lat = typeof court.latitude === 'string' ? Number.parseFloat(court.latitude) : court.latitude;
        const lng = typeof court.longitude === 'string' ? Number.parseFloat(court.longitude) : court.longitude;
        return !Number.isNaN(lat) && !Number.isNaN(lng) && lat !== 0 && lng !== 0;
      })
      .map(court => {
        const lat = typeof court.latitude === 'string' ? Number.parseFloat(court.latitude) : court.latitude;
        const lng = typeof court.longitude === 'string' ? Number.parseFloat(court.longitude) : court.longitude;
        const isPrivate = court.is_public !== undefined ? !court.is_public : court.membership_required;

        const marker = new google.maps.Marker({
          position: { lat, lng },
          title: court.name,
          icon: isPrivate ? iconsRef.current.private : iconsRef.current.public,
          optimized: true,
        });

        marker.addListener('click', () => {
          handleMarkerClick(court.id.toString());
        });

        return marker;
      });

    markersRef.current = newMarkers;

    if (enableClustering && newMarkers.length > 50) {
      // Use clustering for better performance with many markers
      clustererRef.current = new MarkerClusterer({
        map,
        markers: newMarkers,
        renderer: {
          render: ({ count, position }: any, _stats: any) => {
            const color = count < 10 ? '#002C4D' : count < 50 ? '#918AB5' : '#EC0037';
            
            return new google.maps.Marker({
              position,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: Math.min(count * 2, 30),
                fillColor: color,
                fillOpacity: 0.8,
                strokeColor: '#FFFFFF',
                strokeWeight: 2,
              },
              label: {
                text: String(count),
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 'bold',
              },
              optimized: true,
            });
          },
        },
      });
    } else {
      // Add markers directly to map for smaller datasets
      newMarkers.forEach(marker => marker.setMap(map));
    }

    return () => {
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
      }
      markersRef.current.forEach(marker => marker.setMap(null));
    };
  }, [map, courts, handleMarkerClick, enableClustering]);

  return null;
}
