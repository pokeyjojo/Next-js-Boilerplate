'use client';

import type { LatLngTuple } from 'leaflet';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

// Dynamically import Leaflet components with no SSR
const MapContainer = dynamic(
  () => import('react-leaflet').then(mod => mod.MapContainer),
  { ssr: false },
);
const Marker = dynamic(
  () => import('react-leaflet').then(mod => mod.Marker),
  { ssr: false },
);
const Popup = dynamic(
  () => import('react-leaflet').then(mod => mod.Popup),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import('react-leaflet').then(mod => mod.TileLayer),
  { ssr: false },
);
const useMap = dynamic(
  () => import('react-leaflet').then(mod => mod.useMap),
  { ssr: false },
);

// Create a dynamic component for the map
const DynamicMap = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center">
      <div className="text-lg">Loading map...</div>
    </div>
  ),
});

// Custom marker icons for public and private courts
const createCustomIcon = (isPrivate: boolean) => {
  if (typeof window === 'undefined') {
    return null;
  }

  const L = require('leaflet');
  const color = isPrivate ? '#FF4444' : '#3388FF';
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
  state: string;
  zip: string;
  latitude: number;
  longitude: number;
  lighted: boolean;
  membership_required: boolean;
  court_type: string;
  hitting_wall: boolean;
  court_condition: string;
  number_of_courts: number;
  surface: string;
  parking: string;
};

function MapController() {
  const map = useMap();

  useEffect(() => {
    map.setView(CHICAGO_CENTER, 11);
  }, [map]);

  return null;
}

function TennisCourtMarkers({ selectedCourtId }: { selectedCourtId: number | null }) {
  const [courts, setCourts] = useState<TennisCourt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const popupRefs = useRef<{ [key: number]: any }>({});
  const map = useMap();

  useEffect(() => {
    const fetchCourts = async () => {
      try {
        const response = await fetch('/api/courts');
        if (!response.ok) {
          throw new Error('Failed to fetch tennis courts');
        }
        const data = await response.json();
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

  useEffect(() => {
    if (selectedCourtId && popupRefs.current[selectedCourtId]) {
      popupRefs.current[selectedCourtId]?.openOn(map);
    }
  }, [selectedCourtId, map]);

  if (loading) {
    return null;
  }
  if (error) {
    console.error('Error state:', error);
    return null;
  }

  return (
    <>
      {courts.map((court) => {
        return (
          <Marker
            key={court.id}
            position={[court.latitude, court.longitude]}
            icon={createCustomIcon(court.membership_required)}
          >
            <Popup
              ref={(popup) => {
                popupRefs.current[court.id] = popup;
              }}
            >
              <div className="p-2">
                <h3 className="font-bold text-lg mb-2">{court.name}</h3>
                <p className="mb-1">{court.address}</p>
                <p className="mb-1">{court.city}</p>
                <p className="mb-1">
                  {court.state}
                  {(court.zip && court.zip !== '00000') ? ` ${court.zip}` : ''}
                </p>
                <div className="mt-2">
                  {court.number_of_courts !== null
                    && court.number_of_courts !== undefined
                    && court.number_of_courts !== 0
                    && String(court.number_of_courts) !== '0' && (
                    <p>
                      <strong>Courts:</strong>
                      {' '}
                      {court.number_of_courts}
                    </p>
                  )}
                  {court.surface && court.surface !== '' && (
                    <p>
                      <strong>Surface:</strong>
                      {' '}
                      {court.surface}
                    </p>
                  )}
                  <p>
                    <strong>Type:</strong>
                    {' '}
                    {court.court_type}
                  </p>
                  <p>
                    <strong>Lights:</strong>
                    {' '}
                    {court.lighted ? 'Yes' : 'No'}
                  </p>
                  <p>
                    <strong>Access:</strong>
                    {' '}
                    {court.membership_required ? 'Private' : 'Public'}
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

function CourtList({ courts, onCourtSelect }: { courts: TennisCourt[]; onCourtSelect: (court: TennisCourt) => void }) {
  return (
    <div className="h-full overflow-y-auto bg-white p-4">
      <h2 className="text-xl font-bold mb-4">Tennis Courts</h2>
      <div className="space-y-4">
        {courts.map(court => (
          <button
            key={court.id}
            className="w-full text-left p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => onCourtSelect(court)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onCourtSelect(court);
              }
            }}
          >
            <h3 className="font-semibold text-lg">{court.name}</h3>
            <p className="text-gray-600">{court.address}</p>
            <p className="text-gray-600">
              {court.city}
              {', '}
              {court.state}
            </p>
            <div className="mt-2 flex gap-2">
              <span className={`px-2 py-1 rounded text-sm ${court.membership_required ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                {court.membership_required ? 'Private' : 'Public'}
              </span>
              {court.lighted && (
                <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-sm">
                  Lights
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Map() {
  const [courts, setCourts] = useState<TennisCourt[]>([]);
  const [selectedCourtId, setSelectedCourtId] = useState<number | null>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    const fetchCourts = async () => {
      try {
        const response = await fetch('/api/courts');
        if (!response.ok) {
          throw new Error('Failed to fetch tennis courts');
        }
        const data = await response.json();
        setCourts(data);
      } catch (err) {
        console.error('Error fetching courts:', err);
      }
    };

    fetchCourts();
  }, []);

  const handleCourtSelect = (court: TennisCourt) => {
    setSelectedCourtId(court.id);
    if (mapRef.current) {
      mapRef.current.setView([court.latitude, court.longitude], 15);
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/3 border-r">
        <CourtList courts={courts} onCourtSelect={handleCourtSelect} />
      </div>
      <div className="w-2/3">
        <MapContainer
          center={CHICAGO_CENTER}
          zoom={11}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController />
          <TennisCourtMarkers selectedCourtId={selectedCourtId} />
        </MapContainer>
      </div>
    </div>
  );
}

export default DynamicMap;
