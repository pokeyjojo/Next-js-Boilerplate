'use client';

import type { TennisCourt } from '@/hooks/useCourtData';
import dynamic from 'next/dynamic';

type MapProps = {
  selectedCourtFromExternal?: TennisCourt | null;
};

// Create a dynamic component for the map with mobile-friendly design
const DynamicMap = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-[#F4F5F6]">
      <div className="text-lg text-[#7F8B9F]">Loading map...</div>
    </div>
  ),
});

export default function Map({ selectedCourtFromExternal }: MapProps) {
  return <DynamicMap selectedCourtFromExternal={selectedCourtFromExternal} />;
}
