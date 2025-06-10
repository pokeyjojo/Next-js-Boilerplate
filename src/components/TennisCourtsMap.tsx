'use client';

import { Icon } from 'leaflet';
import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in Next.js
const customIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

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

  if (loading) {
    return <div className="h-[600px] flex items-center justify-center">Loading tennis courts...</div>;
  }

  if (error) {
    return (
      <div className="h-[600px] flex items-center justify-center text-red-500">
        Error:
        {error}
      </div>
    );
  }

  return (
    <div className="h-[600px] w-full">
      <MapContainer
        center={[41.8781, -87.6298]} // Chicago coordinates
        zoom={12}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {courts.map(court => (
          <Marker
            key={court.id}
            position={[court.latitude, court.longitude]}
            icon={customIcon}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-lg">{court.name}</h3>
                <p className="text-sm">{court.address}</p>
                <p className="text-sm">{court.city}</p>
                <div className="mt-2 text-sm">
                  <p>
                    Courts:
                    {court.number_of_courts}
                  </p>
                  <p>
                    Surface:
                    {court.surface_type}
                  </p>
                  <p>
                    Indoor:
                    {court.is_indoor ? 'Yes' : 'No'}
                  </p>
                  <p>
                    Lighted:
                    {court.is_lighted ? 'Yes' : 'No'}
                  </p>
                  <p>
                    Public:
                    {court.is_public ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
