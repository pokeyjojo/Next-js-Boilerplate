'use client';

import { useState } from 'react';
import GoogleMapCustomOverlay from './GoogleMapCustomOverlay';

type CustomMarkerProps = {
  position: { lat: number; lng: number };
  title?: string;
  onClick?: () => void;
  isPrivate?: boolean;
  size?: number;
  customIcon?: {
    path: string;
    fillColor: string;
    fillOpacity: number;
    strokeColor: string;
    strokeWeight: number;
    scale: number;
  };
};

export default function GoogleMapCustomMarker({
  position,
  title,
  onClick,
  isPrivate = false,
  size = 24,
  customIcon,
}: CustomMarkerProps) {
  const [isHovered, setIsHovered] = useState(false);

  const markerColor = customIcon ? customIcon.fillColor : (isPrivate ? '#BFC37C' : '#7F8B9F');
  const borderColor = customIcon ? customIcon.strokeColor : '#F4F5F6';
  const hoverScale = isHovered ? 1.2 : 1;

  // If using custom icon, render as SVG
  if (customIcon) {
    return (
      <GoogleMapCustomOverlay position={position}>
        <button
          type="button"
          className="cursor-pointer transition-transform duration-200 ease-out bg-transparent border-none p-0"
          style={{
            transform: `scale(${hoverScale * customIcon.scale})`,
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={onClick}
          title={title}
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            style={{
              filter: isHovered ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
            }}
          >
            <path
              d={customIcon.path}
              fill={customIcon.fillColor}
              fillOpacity={customIcon.fillOpacity}
              stroke={customIcon.strokeColor}
              strokeWidth={customIcon.strokeWeight}
            />
          </svg>
        </button>
      </GoogleMapCustomOverlay>
    );
  }

  return (
    <GoogleMapCustomOverlay position={position}>
      <button
        type="button"
        className="cursor-pointer transition-transform duration-200 ease-out bg-transparent border-none p-0"
        style={{
          transform: `scale(${hoverScale})`,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
        title={title}
      >
        {/* Outer shadow circle */}
        <div
          className="absolute rounded-full"
          style={{
            width: size + 6,
            height: size + 6,
            backgroundColor: 'rgba(127, 139, 159, 0.3)',
            left: -3,
            top: -3,
            zIndex: 1,
          }}
        />

        {/* Main marker circle */}
        <div
          className="relative rounded-full border-2 transition-all duration-200"
          style={{
            width: size,
            height: size,
            backgroundColor: markerColor,
            borderColor,
            boxShadow: isHovered
              ? `0 4px 12px rgba(127, 139, 159, 0.4)`
              : `0 2px 6px rgba(127, 139, 159, 0.3)`,
            zIndex: 2,
          }}
        >
          {/* Inner dot for better visibility */}
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: size * 0.4,
              height: size * 0.4,
              backgroundColor: borderColor,
              opacity: 0.8,
            }}
          />
        </div>

        {/* Pulse animation for hover */}
        {isHovered && (
          <div
            className="absolute rounded-full animate-ping"
            style={{
              width: size + 12,
              height: size + 12,
              backgroundColor: markerColor,
              opacity: 0.3,
              left: -6,
              top: -6,
              zIndex: 0,
            }}
          />
        )}
      </button>
    </GoogleMapCustomOverlay>
  );
}
