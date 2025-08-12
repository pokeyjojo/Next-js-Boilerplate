'use client';

import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { googleMapsService } from '@/libs/GoogleMapsService';
import { useGoogleMap } from './GoogleMap';

type GoogleMapInfoWindowProps = {
  position: { lat: number; lng: number };
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
};

export default function GoogleMapInfoWindow({
  position,
  isOpen,
  onClose,
  children,
}: GoogleMapInfoWindowProps) {
  const map = useGoogleMap();
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const rootRef = useRef<any>(null);

  useEffect(() => {
    if (!map) return;

    // Create info window if it doesn't exist
    if (!infoWindowRef.current) {
      infoWindowRef.current = googleMapsService.createInfoWindow({
        position,
      });

      if (onClose) {
        infoWindowRef.current.addListener('closeclick', onClose);
      }
    }

    // Create a container div for React content
    const contentDiv = document.createElement('div');
    contentDiv.style.maxWidth = '300px';
    
    // Render React content into the div
    rootRef.current = createRoot(contentDiv);
    rootRef.current.render(children);

    infoWindowRef.current.setContent(contentDiv);
    infoWindowRef.current.setPosition(position);

    if (isOpen) {
      infoWindowRef.current.open(map);
    } else {
      infoWindowRef.current.close();
    }

    // Cleanup function
    return () => {
      if (rootRef.current) {
        rootRef.current.unmount();
      }
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    };
  }, [map, position, isOpen, onClose, children]);

  return null; // This component doesn't render anything directly
}



