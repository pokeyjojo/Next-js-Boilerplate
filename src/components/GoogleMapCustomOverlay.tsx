'use client';

import { useEffect, useRef } from 'react';
import { useGoogleMap } from './GoogleMap';

type CustomOverlayProps = {
  position: { lat: number; lng: number };
  children: React.ReactNode;
  zIndex?: number;
};

export default function GoogleMapCustomOverlay({
  position,
  children,
  zIndex = 100,
}: CustomOverlayProps) {
  const map = useGoogleMap();
  const overlayRef = useRef<google.maps.OverlayView | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    if (!map) {
      console.log('GoogleMapCustomOverlay: No map available');
      return;
    }
    console.log('GoogleMapCustomOverlay: Creating overlay at position:', position);

    class CustomOverlay extends google.maps.OverlayView {
      private position: google.maps.LatLng;
      private container: HTMLDivElement;

      constructor(position: google.maps.LatLng, container: HTMLDivElement) {
        super();
        this.position = position;
        this.container = container;
      }

      override onAdd() {
        const panes = this.getPanes();
        if (panes) {
          panes.overlayMouseTarget.appendChild(this.container);
        }
      }

      override draw() {
        const projection = this.getProjection();
        if (!projection) {
          // Projection is not available yet, skip drawing
          return;
        }
        
        const point = projection.fromLatLngToDivPixel(this.position);
        if (point) {
          this.container.style.left = point.x + 'px';
          this.container.style.top = point.y + 'px';
        }
      }

      override onRemove() {
        if (this.container.parentNode) {
          this.container.parentNode.removeChild(this.container);
        }
      }

      updatePosition(newPosition: google.maps.LatLng) {
        this.position = newPosition;
        if (this.getProjection()) {
          this.draw();
        }
      }
    }

    // Create container element
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.transform = 'translate(-50%, -50%)';
    container.style.zIndex = zIndex.toString();
    container.style.pointerEvents = 'auto';
    containerRef.current = container;

    // Create overlay
    const latLng = new google.maps.LatLng(position.lat, position.lng);
    const overlay = new CustomOverlay(latLng, container);
    overlay.setMap(map);
    overlayRef.current = overlay;

    return () => {
      isMountedRef.current = false;
      if (overlayRef.current) {
        // Use setTimeout to avoid race conditions during component unmount
        setTimeout(() => {
          if (overlayRef.current) {
            overlayRef.current.setMap(null);
          }
        }, 0);
      }
    };
  }, [map, zIndex]);

  // Update position when it changes
  useEffect(() => {
    if (overlayRef.current && containerRef.current) {
      const latLng = new google.maps.LatLng(position.lat, position.lng);
      (overlayRef.current as any).updatePosition(latLng);
    }
  }, [position]);

  // Render children into the overlay container
  useEffect(() => {
    if (!containerRef.current || !isMountedRef.current) {
      return undefined;
    }
    
    const initializeRoot = async () => {
      try {
        const { createRoot } = await import('react-dom/client');
        if (containerRef.current && isMountedRef.current) {
          rootRef.current = createRoot(containerRef.current);
          rootRef.current.render(<div>{children}</div>);
        }
      } catch (error) {
        console.error('Error creating overlay root:', error);
      }
    };

    initializeRoot();
        
    return () => {
      if (rootRef.current) {
        // Use setTimeout to avoid synchronous unmounting during render
        setTimeout(() => {
          try {
            if (rootRef.current) {
              rootRef.current.unmount();
              rootRef.current = null;
            }
          } catch (error) {
            console.warn('Error unmounting overlay:', error);
          }
        }, 0);
      }
    };
  }, [children]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return null;
}