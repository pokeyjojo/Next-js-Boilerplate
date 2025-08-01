import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/libs/AdminUtils';
import { getDb } from '@/libs/DB';
import { geocodeAddress } from '@/libs/GeocodingService';
import { courtsSchema } from '@/models/Schema';

export async function POST(req: NextRequest) {
  try {
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      address,
      city,
      state,
      zip,
      courtType,
      numberOfCourts,
      surface,
      courtCondition,
      hittingWall,
      lighted,
      isPublic,
      membershipRequired,
      parking,
    } = body;

    if (!name || !address || !city || !zip) {
      return NextResponse.json(
        { error: 'Name, address, city, and zip code are required' },
        { status: 400 },
      );
    }

    // Geocode the address to get latitude and longitude
    let latitude: number | null = null;
    let longitude: number | null = null;

    try {
      const geocodeResult = await geocodeAddress(address, city, state || 'IL', zip);
      if (geocodeResult) {
        latitude = geocodeResult.latitude;
        longitude = geocodeResult.longitude;
      }
    } catch (geocodeError) {
      console.error('Geocoding failed:', geocodeError);
    }

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Unable to determine coordinates for the provided address. Please verify the address is correct.' },
        { status: 400 },
      );
    }

    const db = await getDb();

    // Insert the court directly into the database
    const [newCourt] = await db
      .insert(courtsSchema)
      .values({
        name,
        address,
        city,
        state,
        zip,
        latitude: latitude.toString(), // Convert to string as the schema expects decimal as string
        longitude: longitude.toString(), // Convert to string as the schema expects decimal as string
        courtType,
        numberOfCourts,
        surface,
        courtCondition,
        hittingWall,
        lighted,
        isPublic,
        membershipRequired,
        parking,
      })
      .returning();

    return NextResponse.json(
      {
        message: 'Court added successfully',
        court: newCourt,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error adding court:', error);
    return NextResponse.json(
      { error: 'An error occurred while adding the court' },
      { status: 500 },
    );
  }
}
