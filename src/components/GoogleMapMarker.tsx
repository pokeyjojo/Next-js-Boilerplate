'use client';

import { useEffect, useRef } from 'react';
import { googleMapsService } from '@/libs/GoogleMapsService';
import { useGoogleMap } from './GoogleMap';

type GoogleMapMarkerProps = {
  position: { lat: number; lng: number };
  title?: string;
  onClick?: () => void;
  icon?: string | google.maps.Icon | google.maps.Symbol;
  isPrivate?: boolean;
};

export default function GoogleMapMarker({
  position,
  title,
  onClick,
  icon,
  isPrivate = false,
}: GoogleMapMarkerProps) {
  const map = useGoogleMap();
  const markerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    if (!map) return;

    try {
      // Create custom marker icon if not provided
      const markerIcon = icon || {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: isPrivate ? '#EC0037' : '#002C4D', // Crimson Rally for private, Midnight Arena for public
        fillOpacity: 1,
        strokeColor: '#FFFFFF', // Precision White
        strokeWeight: 3,
      };

      const marker = googleMapsService.createMarker({
        position,
        map,
        title,
        icon: markerIcon,
      });

      if (onClick) {
        marker.addListener('click', onClick);
      }

      markerRef.current = marker;

      // Cleanup function
      return () => {
        if (markerRef.current) {
          markerRef.current.setMap(null);
        }
      };
    } catch (error) {
      console.error(`Error creating marker for "${title}":`, error);
      return; // Add explicit return for error case
    }
  }, [map, position, title, onClick, icon, isPrivate]);

  // Update marker position when position changes
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setPosition(position);
    }
  }, [position]);

  return null; // This component doesn't render anything directly
}
