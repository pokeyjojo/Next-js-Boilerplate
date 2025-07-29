import type { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '@/libs/DB';
import { courtEditSuggestionSchema, courtsSchema } from '@/models/Schema';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const { id: courtId } = await params;
    const body = await request.json();
    const {
      reason,
      suggestedName,
      suggestedAddress,
      suggestedCity,
      suggestedState,
      suggestedZip,
      suggestedCourtType,
      suggestedNumberOfCourts,
      suggestedSurface,
    } = body;

    // Check if court exists using the courts schema (UUID)
    const court = await db.select().from(courtsSchema).where(eq(courtsSchema.id, courtId)).limit(1);
    if (court.length === 0) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 });
    }

    // Check if user already has a pending suggestion for this court
    const existingSuggestion = await db
      .select()
      .from(courtEditSuggestionSchema)
      .where(
        and(
          eq(courtEditSuggestionSchema.courtId, courtId),
          eq(courtEditSuggestionSchema.suggestedBy, userId),
          eq(courtEditSuggestionSchema.status, 'pending'),
        ),
      )
      .limit(1);

    if (existingSuggestion.length > 0) {
      return NextResponse.json(
        { error: 'You already have a pending suggestion for this court' },
        { status: 400 },
      );
    }

    // Create the suggestion
    const [suggestion] = await db
      .insert(courtEditSuggestionSchema)
      .values({
        courtId,
        suggestedBy: userId,
        suggestedByUserName: 'User', // Simplified for now
        reason,
        suggestedName,
        suggestedAddress,
        suggestedCity,
        suggestedState,
        suggestedZip,
        suggestedCourtType,
        suggestedNumberOfCourts,
        suggestedSurface,
      })
      .returning();

    return NextResponse.json(suggestion, { status: 201 });
  } catch (error) {
    console.error('Error creating court edit suggestion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const { id: courtId } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const whereConditions = [eq(courtEditSuggestionSchema.courtId, courtId)];

    if (status) {
      whereConditions.push(eq(courtEditSuggestionSchema.status, status));
    }

    const suggestions = await db
      .select()
      .from(courtEditSuggestionSchema)
      .where(and(...whereConditions))
      .orderBy(courtEditSuggestionSchema.createdAt);

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Error fetching court edit suggestions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
