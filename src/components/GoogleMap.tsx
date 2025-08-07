'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { googleMapsService } from '@/libs/GoogleMapsService';

// Context for child components to access the map instance
const GoogleMapContext = React.createContext<google.maps.Map | null>(null);

const defaultStyle: React.CSSProperties = { height: '100%', width: '100%' };

type GoogleMapProps = {
  center: { lat: number; lng: number };
  zoom: number;
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
  onMapReady?: (map: google.maps.Map) => void;
  onClick?: (event: google.maps.MapMouseEvent) => void;
};

export default function GoogleMap({
  center,
  zoom,
  style = defaultStyle,
  className,
  children,
  onMapReady,
  onClick,
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [contextReady, setContextReady] = useState(false);

  const initializeMap = useCallback(async () => {
    if (!mapRef.current) {
      return;
    }

    // Prevent multiple initializations
    if (mapInstanceRef.current) {
      return;
    }

    try {
      await googleMapsService.loadMaps();

      const mapOptions: google.maps.MapOptions = {
        center,
        zoom,
        zoomControl: false,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: false,
        styles: [
          {
            featureType: 'all',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#002C4D' }], // Midnight Arena
          },
          {
            featureType: 'all',
            elementType: 'labels.text.stroke',
            stylers: [{ color: '#FFFFFF' }], // Precision White
          },
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#EBEDEE' }], // Cloudy Court
          },
          {
            featureType: 'road.highway',
            elementType: 'geometry',
            stylers: [{ color: '#BFC3C7' }], // Silver Armor
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#69F0FD' }], // Court Flash
          },
          {
            featureType: 'landscape',
            elementType: 'geometry',
            stylers: [{ color: '#EBEDEE' }], // Cloudy Court
          },
          {
            featureType: 'poi',
            elementType: 'geometry',
            stylers: [{ color: '#918AB5' }], // Victory Lavender
          },
        ],
      };

      const map = googleMapsService.createMap(mapRef.current, mapOptions);
      mapInstanceRef.current = map;

      if (onClick) {
        map.addListener('click', onClick);
      }

      // Wait for the map to be fully rendered before setting loaded state
      google.maps.event.addListenerOnce(map, 'idle', () => {
        setIsLoaded(true);

        setTimeout(() => {
          setContextReady(true);

          setTimeout(() => {
            onMapReady?.(map);
          }, 10);
        }, 10);
      });

      // Fallback in case idle event doesn't fire
      setTimeout(() => {
        if (!mapInstanceRef.current || !mapRef.current) {
          return;
        }

        setIsLoaded(true);
        setContextReady(true);
        onMapReady?.(map);
      }, 1000);
    } catch (error) {
      console.error('Failed to initialize Google Map:', error);
    }
  }, [center, zoom, onClick, onMapReady]);

  useEffect(() => {
    // Only initialize if we don't already have a map instance
    if (mapInstanceRef.current) {
      return;
    }

    // Ensure the ref is available before initializing
    const timer = setTimeout(() => {
      if (mapRef.current && !mapInstanceRef.current) {
        initializeMap();
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [initializeMap]);

  // Update map center and zoom when props change
  useEffect(() => {
    if (mapInstanceRef.current && isLoaded) {
      mapInstanceRef.current.setCenter(center);
      mapInstanceRef.current.setZoom(zoom);
    }
  }, [center, zoom, isLoaded]);

  return (
    <div className={className} style={style}>
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
      {isLoaded && contextReady && children && (
        <GoogleMapContext value={mapInstanceRef.current}>
          {children}
        </GoogleMapContext>
      )}
    </div>
  );
}

export function useGoogleMap(): google.maps.Map | null {
  return React.use(GoogleMapContext);
}
