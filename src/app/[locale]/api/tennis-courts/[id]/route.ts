import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getDb } from '@/libs/DB';
import { courtsSchema } from '@/models/Schema';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: courtId } = await params;
    const db = await getDb();
    const court = await db
      .select()
      .from(courtsSchema)
      .where(eq(courtsSchema.id, courtId))
      .limit(1);

    if (court.length === 0) {
      return NextResponse.json(
        { error: 'Court not found' },
        { status: 404 },
      );
    }

    // Transform the data to match the frontend expectations
    const courtData = {
      id: court[0].id,
      name: court[0].name,
      address: court[0].address,
      city: court[0].city,
      state: court[0].state || '',
      zip: court[0].zip || '',
      latitude: Number(court[0].latitude),
      longitude: Number(court[0].longitude),
      lighted: court[0].lighted || false,
      membership_required: court[0].membershipRequired || false,
      court_type: court[0].courtType || '',
      hitting_wall: court[0].hittingWall || false,
      court_condition: court[0].courtCondition || '',
      number_of_courts: court[0].numberOfCourts || 0,
      surface: court[0].surface || '',
      parking: court[0].parking || false,
      // Add camelCase versions for frontend compatibility
      numberOfCourts: court[0].numberOfCourts || 0,
      surfaceType: court[0].surface || '',
      courtCondition: court[0].courtCondition || '',
      isIndoor: false, // Default value since not in courts table
      isLighted: court[0].lighted || false,
      isPublic: true, // Default value since not in courts table
      createdAt: court[0].createdAt || new Date().toISOString(),
      updatedAt: court[0].updatedAt || new Date().toISOString(),
    };

    return NextResponse.json(courtData);
  } catch (error) {
    console.error('Error fetching court:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
