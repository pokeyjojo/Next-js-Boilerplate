'use client';

import type { LatLngTuple } from 'leaflet';
import L from 'leaflet';
import { useEffect, useRef, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

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

// Custom marker icons for public and private courts
const createCustomIcon = (isPrivate: boolean) => {
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

  const getDirectionsUrl = (court: TennisCourt) => {
    const address = `${court.address}, ${court.city}, ${court.state} ${court.zip}`.replace(/\s+/g, '+');
    return `https://www.google.com/maps/dir/?api=1&destination=${address}`;
  };

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
                <div className="mt-4">
                  <a
                    href={getDirectionsUrl(court)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Get Directions
                  </a>
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showLightedOnly, setShowLightedOnly] = useState(false);
  const [filteredCourts, setFilteredCourts] = useState(courts);

  useEffect(() => {
    const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/).filter(term => term.length > 0);

    const filtered = courts.filter((court) => {
      // First check if we should show only lighted courts
      if (showLightedOnly && !court.lighted) {
        return false;
      }

      // Special handling for public/private terms
      const publicPrivateTerms = searchTerms.filter(term =>
        term === 'public' || term === 'private',
      );
      // Get remaining terms
      const otherTerms = searchTerms.filter(term =>
        term !== 'public' && term !== 'private',
      );

      // Check public/private status first
      const matchesPublicPrivate = publicPrivateTerms.length === 0
        || publicPrivateTerms.some(term =>
          (term === 'public' && !court.membership_required)
          || (term === 'private' && court.membership_required),
        );

      if (!matchesPublicPrivate) {
        return false;
      }

      // If no other terms, return true if special terms matched
      if (otherTerms.length === 0) {
        return true;
      }

      // Check other search terms
      const searchableFields = [
        court.name,
        court.address,
        court.city,
        court.state,
        court.zip,
        court.court_type,
        court.surface,
      ].map(field => (field || '').toLowerCase());

      return otherTerms.every(term =>
        searchableFields.some(field => field.includes(term)),
      );
    });

    setFilteredCourts(filtered);
  }, [searchQuery, courts, showLightedOnly]);

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name, address, ZIP, type, etc. (e.g., 'public 60601')"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
        <div className="mt-3 flex items-center">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showLightedOnly}
              onChange={e => setShowLightedOnly(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Lights</span>
          </label>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          {filteredCourts.length}
          {' '}
          {filteredCourts.length === 1 ? 'court' : 'courts'}
          {' '}
          found
          {searchQuery && (
            <span className="ml-2">
              matching "
              {searchQuery}
              "
            </span>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {filteredCourts.map(court => (
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
          {filteredCourts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No courts found matching your search
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MapComponent() {
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
      mapRef.current.flyTo(
        [court.latitude, court.longitude],
        15,
        {
          duration: 1.5,
          easeLinearity: 0.25,
          noMoveStart: true,
        },
      );
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
          whenReady={() => {
            if (mapRef.current) {
              mapRef.current.invalidateSize();
            }
          }}
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
