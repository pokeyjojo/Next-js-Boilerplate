'use client';

import type { LatLngTuple } from 'leaflet';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Custom marker icons for public and private courts
const createCustomIcon = (isPublic: boolean) => {
  const color = isPublic ? '#3388FF' : '#FF4444';
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 10px rgba(0,0,0,0.3);
        animation: pulse 2s infinite;
      ">
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Add the pulse animation to the document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.2);
        opacity: 0.8;
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
}

const CHICAGO_CENTER: LatLngTuple = [41.8781, -87.6298];

type TennisCourt = {
  id: number;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  numberOfCourts: number;
  surfaceType: string;
  isIndoor: boolean;
  isLighted: boolean;
  isPublic: boolean;
};

function MapController() {
  const map = useMap();

  useEffect(() => {
    map.setView(CHICAGO_CENTER, 11);
  }, [map]);

  return null;
}

function TennisCourtMarkers() {
  const [courts, setCourts] = useState<TennisCourt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourts = async () => {
      try {
        console.log('Fetching tennis courts...');
        const response = await fetch('/api/tennis-courts');
        if (!response.ok) {
          throw new Error('Failed to fetch tennis courts');
        }
        const data = await response.json();
        console.log('Fetched courts:', data);
        setCourts(data);
      } catch (err) {
        console.error('Error fetching courts:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCourts();
  }, []);

  if (loading) {
    console.log('Loading courts...');
    return null;
  }
  if (error) {
    console.error('Error state:', error);
    return null;
  }

  console.log('Rendering courts:', courts);

  return (
    <>
      {courts.map((court) => {
        console.log('Rendering court:', court);
        return (
          <Marker
            key={court.id}
            position={[court.latitude, court.longitude]}
            icon={createCustomIcon(court.isPublic)}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-lg mb-2">{court.name}</h3>
                <p className="mb-1">{court.address}</p>
                <p className="mb-1">{court.city}</p>
                <div className="mt-2">
                  <p>
                    <strong>Courts:</strong>
                    {' '}
                    {court.numberOfCourts}
                  </p>
                  <p>
                    <strong>Surface:</strong>
                    {' '}
                    {court.surfaceType}
                  </p>
                  <p>
                    <strong>Type:</strong>
                    {' '}
                    {court.isIndoor ? 'Indoor' : 'Outdoor'}
                  </p>
                  <p>
                    <strong>Lights:</strong>
                    {' '}
                    {court.isLighted ? 'Yes' : 'No'}
                  </p>
                  <p>
                    <strong>Access:</strong>
                    {' '}
                    {court.isPublic ? 'Public' : 'Private'}
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

export default function Map() {
  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
      <MapContainer
        center={CHICAGO_CENTER}
        zoom={11}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController />
        <TennisCourtMarkers />
      </MapContainer>
    </div>
  );
}
