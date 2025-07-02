import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getDb } from '@/libs/DB';
import { tennisCourtSchema } from '@/models/Schema';

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const courtId = params.id;
    const db = await getDb();
    const court = await db
      .select()
      .from(tennisCourtSchema)
      .where(eq(tennisCourtSchema.id, courtId))
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
      latitude: Number(court[0].latitude),
      longitude: Number(court[0].longitude),
      numberOfCourts: court[0].numberOfCourts,
      surfaceType: court[0].surfaceType,
      isIndoor: court[0].isIndoor,
      isLighted: court[0].isLighted,
      isPublic: court[0].isPublic,
      createdAt: court[0].createdAt.toISOString(),
      updatedAt: court[0].updatedAt.toISOString(),
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
