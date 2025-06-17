'use client';

import dynamic from 'next/dynamic';

// Create a dynamic component for the map with mobile-friendly design
const DynamicMap = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center">
      <div className="text-lg">Loading map...</div>
    </div>
  ),
});

export default DynamicMap;
