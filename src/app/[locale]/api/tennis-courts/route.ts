import { eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getDb } from '@/libs/DB';
import { reviewSchema, tennisCourtSchema } from '@/models/Schema';

export async function GET() {
  try {
    const db = await getDb();

    const courtsWithRatings = await db
      .select({
        id: tennisCourtSchema.id,
        name: tennisCourtSchema.name,
        address: tennisCourtSchema.address,
        city: tennisCourtSchema.city,
        latitude: tennisCourtSchema.latitude,
        longitude: tennisCourtSchema.longitude,
        numberOfCourts: tennisCourtSchema.numberOfCourts,
        surfaceType: tennisCourtSchema.surfaceType,
        isIndoor: tennisCourtSchema.isIndoor,
        isLighted: tennisCourtSchema.isLighted,
        isPublic: tennisCourtSchema.isPublic,
        createdAt: tennisCourtSchema.createdAt,
        updatedAt: tennisCourtSchema.updatedAt,
        averageRating: sql<number>`COALESCE(AVG(${reviewSchema.rating}), 0)`,
        reviewCount: sql<number>`COUNT(${reviewSchema.id})`,
      })
      .from(tennisCourtSchema)
      .leftJoin(reviewSchema, eq(tennisCourtSchema.id, reviewSchema.courtId))
      .groupBy(
        tennisCourtSchema.id,
        tennisCourtSchema.name,
        tennisCourtSchema.address,
        tennisCourtSchema.city,
        tennisCourtSchema.latitude,
        tennisCourtSchema.longitude,
        tennisCourtSchema.numberOfCourts,
        tennisCourtSchema.surfaceType,
        tennisCourtSchema.isIndoor,
        tennisCourtSchema.isLighted,
        tennisCourtSchema.isPublic,
        tennisCourtSchema.createdAt,
        tennisCourtSchema.updatedAt,
      );

    return NextResponse.json(courtsWithRatings);
  } catch (error) {
    console.error('Error fetching tennis courts:', error);
    return NextResponse.json({ error: 'Failed to fetch tennis courts' }, { status: 500 });
  }
}
