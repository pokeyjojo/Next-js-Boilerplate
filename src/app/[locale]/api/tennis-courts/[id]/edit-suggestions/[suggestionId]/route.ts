import type { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '@/libs/DB';
import { courtEditSuggestionSchema, courtsSchema } from '@/models/Schema';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; suggestionId: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const { suggestionId } = await params;
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

    // Get the suggestion
    const [suggestion] = await db
      .select()
      .from(courtEditSuggestionSchema)
      .where(eq(courtEditSuggestionSchema.id, suggestionId))
      .limit(1);

    if (!suggestion) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
    }

    // Check if user owns the suggestion
    if (suggestion.suggestedBy !== userId) {
      return NextResponse.json(
        { error: 'You can only edit your own suggestions' },
        { status: 403 },
      );
    }

    // Check if suggestion is still pending
    if (suggestion.status !== 'pending') {
      return NextResponse.json(
        { error: 'You can only edit pending suggestions' },
        { status: 400 },
      );
    }

    // Update the suggestion
    const [updatedSuggestion] = await db
      .update(courtEditSuggestionSchema)
      .set({
        reason,
        suggestedName,
        suggestedAddress,
        suggestedCity,
        suggestedState,
        suggestedZip,
        suggestedCourtType,
        suggestedNumberOfCourts,
        suggestedSurface,
        updatedAt: new Date(),
      })
      .where(eq(courtEditSuggestionSchema.id, suggestionId))
      .returning();

    return NextResponse.json(updatedSuggestion);
  } catch (error) {
    console.error('Error updating suggestion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; suggestionId: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const { suggestionId } = await params;
    const body = await request.json();
    const { status, reviewNote } = body;

    // Get the suggestion
    const [suggestion] = await db
      .select()
      .from(courtEditSuggestionSchema)
      .where(eq(courtEditSuggestionSchema.id, suggestionId))
      .limit(1);

    if (!suggestion) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
    }

    // Check if user is trying to review their own suggestion
    if (suggestion.suggestedBy === userId) {
      return NextResponse.json(
        { error: 'You cannot review your own suggestion' },
        { status: 400 },
      );
    }

    // Update the suggestion
    const [updatedSuggestion] = await db
      .update(courtEditSuggestionSchema)
      .set({
        status,
        reviewedBy: userId,
        reviewedByUserName: 'User', // Simplified for now
        reviewNote,
        reviewedAt: new Date(),
      })
      .where(eq(courtEditSuggestionSchema.id, suggestionId))
      .returning();

    // If approved, apply the changes to the court
    if (status === 'approved') {
      const updateData: any = {};

      // Check for suggested fields and add them to updateData
      if (suggestion.suggestedName !== null && suggestion.suggestedName !== undefined) {
        updateData.name = suggestion.suggestedName;
      }
      if (suggestion.suggestedAddress !== null && suggestion.suggestedAddress !== undefined) {
        updateData.address = suggestion.suggestedAddress;
      }
      if (suggestion.suggestedCity !== null && suggestion.suggestedCity !== undefined) {
        updateData.city = suggestion.suggestedCity;
      }
      if (suggestion.suggestedState !== null && suggestion.suggestedState !== undefined) {
        updateData.state = suggestion.suggestedState;
      }
      if (suggestion.suggestedZip !== null && suggestion.suggestedZip !== undefined) {
        updateData.zip = suggestion.suggestedZip;
      }
      if (suggestion.suggestedCourtType !== null && suggestion.suggestedCourtType !== undefined) {
        updateData.court_type = suggestion.suggestedCourtType;
      }
      if (suggestion.suggestedNumberOfCourts !== null && suggestion.suggestedNumberOfCourts !== undefined && suggestion.suggestedNumberOfCourts > 0) {
        updateData.number_of_courts = suggestion.suggestedNumberOfCourts;
      }
      if (suggestion.suggestedSurface !== null && suggestion.suggestedSurface !== undefined) {
        updateData.surface = suggestion.suggestedSurface;
      }

      if (Object.keys(updateData).length > 0) {
        // Use Drizzle ORM to update the courts table
        console.error('Updating court with data:', updateData);

        await db
          .update(courtsSchema)
          .set(updateData)
          .where(eq(courtsSchema.id, suggestion.courtId));
      } else {
        console.error('No fields to update for suggestion:', suggestion);
      }
    }

    return NextResponse.json(updatedSuggestion);
  } catch (error) {
    console.error('Error updating suggestion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; suggestionId: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const { suggestionId } = await params;

    // Get the suggestion
    const [suggestion] = await db
      .select()
      .from(courtEditSuggestionSchema)
      .where(eq(courtEditSuggestionSchema.id, suggestionId))
      .limit(1);

    if (!suggestion) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
    }

    // Check if user owns the suggestion or is admin
    if (suggestion.suggestedBy !== userId) {
      // Check if user is admin
      const adminResponse = await fetch(`${request.nextUrl.origin}/api/admin/check`);
      if (!adminResponse.ok) {
        return NextResponse.json(
          { error: 'You can only delete your own suggestions' },
          { status: 403 },
        );
      }
    }

    // Delete the suggestion
    await db
      .delete(courtEditSuggestionSchema)
      .where(eq(courtEditSuggestionSchema.id, suggestionId));

    return NextResponse.json({ message: 'Suggestion deleted successfully' });
  } catch (error) {
    console.error('Error deleting suggestion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
