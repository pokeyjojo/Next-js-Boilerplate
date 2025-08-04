'use client';

import dynamic from 'next/dynamic';

// Create a dynamic component for the map with mobile-friendly design
const DynamicMap = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-[#002C4D]">
      <div className="text-lg text-[#BFC3C7]">Loading map...</div>
    </div>
  ),
});

export default DynamicMap;
