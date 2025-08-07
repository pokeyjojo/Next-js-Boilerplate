'use client';

import type { TennisCourt } from '@/hooks/useCourtData';
import GoogleMapCustomMarker from './GoogleMapCustomMarker';

export function GoogleMapTennisCourtMarkers({ 
  courts, 
  handleMarkerClick 
}: { 
  courts: TennisCourt[]; 
  handleMarkerClick: (courtId: string) => void;
}) {
  console.log('GoogleMapTennisCourtMarkers: Received courts data:', courts?.length);
  
  if (!courts || courts.length === 0) {
    console.log('GoogleMapTennisCourtMarkers: No courts data available');
    return null;
  }

  return (
    <>
      {courts.map(court => {
        // Ensure coordinates are numbers
        const lat = typeof court.latitude === 'string' ? Number.parseFloat(court.latitude) : court.latitude;
        const lng = typeof court.longitude === 'string' ? Number.parseFloat(court.longitude) : court.longitude;
        
        // Skip courts with invalid coordinates
        if (Number.isNaN(lat) || Number.isNaN(lng) || lat === 0 || lng === 0) {
          console.warn(`Invalid coordinates for court ${court.name}:`, { lat, lng });
          return null;
        }
        
        console.log(`Creating marker for court ${court.name} at:`, { lat, lng });
        
        return (
          <GoogleMapCustomMarker
            key={court.id}
            position={{ lat, lng }}
            title={court.name}
            isPrivate={court.membership_required}
            onClick={() => handleMarkerClick(court.id.toString())}
          />
        );
      })}
    </>
  );
}
