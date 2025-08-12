import { NextResponse } from 'next/server';
import { Env } from '@/libs/Env';
import { geocodeAddress } from '@/libs/GoogleMapsService';

export async function GET() {
  try {
    // Test with multiple known addresses
    const addresses = [
      { address: '245 Crestview Avenue', city: 'Elmhurst', state: 'IL', zip: '60126' },
      { address: '1600 Amphitheatre Parkway', city: 'Mountain View', state: 'CA', zip: '94043' }, // Google HQ
      { address: '350 Fifth Avenue', city: 'New York', state: 'NY', zip: '10118' }, // Empire State Building
    ];

    const results = [];
    const apiKey = Env.GOOGLE_MAPS_SERVER_API_KEY;

    for (const addr of addresses) {
      // Test direct API call to get raw response
      const fullAddress = `${addr.address}, ${addr.city}, ${addr.state} ${addr.zip}`;
      const encodedAddress = encodeURIComponent(fullAddress);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

      try {
        const response = await fetch(url);
        const rawData = await response.json();

        // Also test our service
        const serviceResult = await geocodeAddress(addr.address, addr.city, addr.state, addr.zip);

        results.push({
          address: fullAddress,
          rawGoogleResponse: rawData,
          serviceResult,
          responseStatus: response.status,
        });
      } catch (error) {
        results.push({
          address: fullAddress,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      serverApiKeyPreview: apiKey ? `${apiKey.slice(0, 10)}...` : 'NOT SET',
      clientApiKeyPreview: Env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? `${Env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.slice(0, 10)}...` : 'NOT SET',
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Test geocoding error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      hasServerKey: !!Env.GOOGLE_MAPS_SERVER_API_KEY,
      hasClientKey: !!Env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
