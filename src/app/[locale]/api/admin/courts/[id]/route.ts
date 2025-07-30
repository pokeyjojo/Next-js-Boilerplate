import type { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '@/libs/DB';
import { courtsSchema } from '@/models/Schema';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminResponse = await fetch(`${request.nextUrl.origin}/api/admin/check`);
    if (!adminResponse.ok) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const db = await getDb();
    const { id: courtId } = await params;
    const body = await request.json();
    const {
      name,
      address,
      city,
      numberOfCourts,
      surface,
      courtCondition,
      courtType,
      hittingWall,
      lighted,
    } = body;

    // Check if court exists
    const court = await db.select().from(courtsSchema).where(eq(courtsSchema.id, courtId)).limit(1);
    if (court.length === 0) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) {
      updateData.name = name;
    }
    if (address !== undefined) {
      updateData.address = address;
    }
    if (city !== undefined) {
      updateData.city = city;
    }
    if (numberOfCourts !== undefined) {
      updateData.numberOfCourts = numberOfCourts;
    }
    if (surface !== undefined) {
      updateData.surface = surface;
    }
    if (courtCondition !== undefined) {
      updateData.courtCondition = courtCondition;
    }
    if (courtType !== undefined) {
      updateData.courtType = courtType;
    }
    if (hittingWall !== undefined) {
      updateData.hittingWall = hittingWall;
    }
    if (lighted !== undefined) {
      updateData.lighted = lighted;
    }

    // Update the court using Drizzle
    const [updatedCourt] = await db
      .update(courtsSchema)
      .set(updateData)
      .where(eq(courtsSchema.id, courtId))
      .returning();

    return NextResponse.json(updatedCourt);
  } catch (error) {
    console.error('Error updating court:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
