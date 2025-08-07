'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import GoogleMap from './GoogleMap';
import GoogleMapCustomMarker from './GoogleMapCustomMarker';

type TennisCourt = {
  id: number;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  number_of_courts: number;
  surface_type: string;
  is_indoor: boolean;
  is_lighted: boolean;
  is_public: boolean;
};

export default function TennisCourtsMap() {
  const router = useRouter();
  const [courts, setCourts] = useState<TennisCourt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourts = async () => {
      try {
        const response = await fetch('/en/api/tennis-courts');
        if (!response.ok) {
          throw new Error('Failed to fetch tennis courts');
        }
        const data = await response.json();
        setCourts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCourts();
  }, []);

  const handleMarkerClick = (courtId: number) => {
    router.push(`/en/courts/${courtId}`);
  };

  if (loading) {
    return (
      <div className="h-[400px] sm:h-[500px] lg:h-[600px] flex items-center justify-center text-sm sm:text-base">
        Loading tennis courts...
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[400px] sm:h-[500px] lg:h-[600px] flex items-center justify-center text-red-500 text-sm sm:text-base">
        Error:
        {' '}
        {error}
      </div>
    );
  }

  return (
    <div className="h-[400px] sm:h-[500px] lg:h-[600px] w-full">
      <GoogleMap
        center={{ lat: 41.8781, lng: -87.6298 }} // Chicago coordinates
        zoom={12}
        style={{ height: '100%', width: '100%' }}
      >
        {courts.map((court) => {
          // Ensure coordinates are valid numbers
          const lat = typeof court.latitude === 'string' ? Number.parseFloat(court.latitude) : court.latitude;
          const lng = typeof court.longitude === 'string' ? Number.parseFloat(court.longitude) : court.longitude;

          if (Number.isNaN(lat) || Number.isNaN(lng) || lat === 0 || lng === 0) {
            console.warn(`Skipping court ${court.name} due to invalid coordinates:`, { lat, lng });
            return null;
          }

          return (
            <GoogleMapCustomMarker
              key={court.id}
              position={{ lat, lng }}
              title={court.name}
              isPrivate={court.is_public !== undefined ? !court.is_public : false}
              onClick={() => handleMarkerClick(court.id)}
            />
          );
        })}
      </GoogleMap>
    </div>
  );
}
