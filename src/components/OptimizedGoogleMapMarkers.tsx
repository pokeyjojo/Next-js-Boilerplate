'use client';

import type { TennisCourt } from '@/hooks/useCourtData';
import { useState, useEffect, useMemo } from 'react';
import { OptimizedMarkerClusterer } from './OptimizedMarkerClusterer';
import { ViewportBasedMarkers } from './ViewportBasedMarkers';
// WebGL renderer removed to avoid SSR issues - can be imported separately if needed

export type PerformanceMode = 'auto' | 'basic' | 'viewport' | 'clustered';

interface OptimizedGoogleMapMarkersProps {
  courts: TennisCourt[];
  handleMarkerClick: (courtId: string) => void;
  performanceMode?: PerformanceMode;
  maxVisibleMarkers?: number;
}

export function OptimizedGoogleMapMarkers({
  courts,
  handleMarkerClick,
  performanceMode = 'auto',
  maxVisibleMarkers = 200,
}: OptimizedGoogleMapMarkersProps) {
  const [detectedMode, setDetectedMode] = useState<PerformanceMode>('basic');

  // Detect performance capabilities
  useEffect(() => {
    const detectCapabilities = () => {
      // Auto-detect best mode based on court count and device capabilities
      if (performanceMode === 'auto') {
        const courtCount = courts.length;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (courtCount > 200) {
          setDetectedMode('clustered');
        } else if (courtCount > 50 || isMobile) {
          setDetectedMode('viewport');
        } else {
          setDetectedMode('basic');
        }
      }
    };

    detectCapabilities();
  }, [courts.length, performanceMode]);

  // Memoize court validation to avoid unnecessary processing
  const validCourts = useMemo(() => {
    return courts.filter(court => {
      const lat = typeof court.latitude === 'string' ? Number.parseFloat(court.latitude) : court.latitude;
      const lng = typeof court.longitude === 'string' ? Number.parseFloat(court.longitude) : court.longitude;
      return !Number.isNaN(lat) && !Number.isNaN(lng) && lat !== 0 && lng !== 0;
    });
  }, [courts]);

  const activeMode = performanceMode === 'auto' ? detectedMode : performanceMode;

  // Render appropriate marker component based on mode
  switch (activeMode) {
    case 'clustered':
      return (
        <OptimizedMarkerClusterer
          courts={validCourts}
          handleMarkerClick={handleMarkerClick}
          enableClustering={true}
        />
      );

    case 'viewport':
      return (
        <ViewportBasedMarkers
          courts={validCourts}
          handleMarkerClick={handleMarkerClick}
          maxVisibleMarkers={maxVisibleMarkers}
        />
      );

    case 'basic':
    default:
      // Use the original optimized markers for basic mode
      return (
        <OptimizedMarkerClusterer
          courts={validCourts}
          handleMarkerClick={handleMarkerClick}
          enableClustering={false}
        />
      );
  }
}

// Export the individual components for direct use if needed
export { OptimizedMarkerClusterer, ViewportBasedMarkers };