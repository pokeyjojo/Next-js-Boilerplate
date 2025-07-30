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
      suggestedCondition,
      suggestedType,
      suggestedHittingWall,
      suggestedLights,
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

    // Validate reason field length
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
    }
    if (reason.trim().length > 100) {
      return NextResponse.json({ error: 'Reason must be 100 characters or less' }, { status: 400 });
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
        suggestedCondition,
        suggestedType,
        suggestedHittingWall,
        suggestedLights,
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
    const { status, reviewNote, field } = body;

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

    const updateData: any = {
      reviewedBy: userId,
      reviewedByUserName: 'User', // Simplified for now
      reviewNote,
      reviewedAt: new Date(),
    };

    // If a specific field is provided, handle field-specific approval/rejection
    if (field) {
      const fieldMapping: { [key: string]: string } = {
        name: 'suggestedName',
        address: 'suggestedAddress',
        city: 'suggestedCity',
        state: 'suggestedState',
        zip: 'suggestedZip',
        courtType: 'suggestedCourtType',
        numberOfCourts: 'suggestedNumberOfCourts',
        surface: 'suggestedSurface',
        condition: 'suggestedCondition',
        type: 'suggestedType',
        hittingWall: 'suggestedHittingWall',
        lights: 'suggestedLights',
      };

      const suggestedField = fieldMapping[field];
      if (suggestedField) {
        if (status === 'approved') {
          // Apply the change to the court
          const courtFieldMapping: { [key: string]: string } = {
            name: 'name',
            address: 'address',
            city: 'city',
            state: 'state',
            zip: 'zip',
            courtType: 'courtType',
            numberOfCourts: 'numberOfCourts',
            surface: 'surface',
            condition: 'courtCondition',
            type: 'courtType',
            hittingWall: 'hittingWall',
            lights: 'lighted',
          };

          const dbField = courtFieldMapping[field];
          const suggestedValue = suggestion[suggestedField as keyof typeof suggestion];

          if (suggestedValue !== null && suggestedValue !== undefined && dbField) {
            // Special handling for numberOfCourts - only update if > 0
            if (field === 'numberOfCourts') {
              if (suggestedValue > 0) {
                await db
                  .update(courtsSchema)
                  .set({ [dbField]: suggestedValue })
                  .where(eq(courtsSchema.id, suggestion.courtId));
              }
            } else {
              await db
                .update(courtsSchema)
                .set({ [dbField]: suggestedValue })
                .where(eq(courtsSchema.id, suggestion.courtId));
            }
          } else {
            console.error('Invalid field mapping or value:', { field, dbField, suggestedValue });
            return NextResponse.json(
              { error: 'Invalid field mapping or value' },
              { status: 400 },
            );
          }

          // Clear the approved field from the suggestion
          updateData[suggestedField as string] = null;
        } else if (status === 'rejected') {
          // Clear the rejected field from the suggestion
          updateData[suggestedField as string] = null;
        }
      }
    } else {
      // Legacy behavior: handle entire suggestion approval/rejection
      updateData.status = status;

      if (status === 'approved') {
        // Apply all suggested changes to the court
        const courtUpdateData: any = {};

        if (suggestion.suggestedName !== null && suggestion.suggestedName !== undefined) {
          courtUpdateData.name = suggestion.suggestedName;
        }
        if (suggestion.suggestedAddress !== null && suggestion.suggestedAddress !== undefined) {
          courtUpdateData.address = suggestion.suggestedAddress;
        }
        if (suggestion.suggestedCity !== null && suggestion.suggestedCity !== undefined) {
          courtUpdateData.city = suggestion.suggestedCity;
        }
        if (suggestion.suggestedState !== null && suggestion.suggestedState !== undefined) {
          courtUpdateData.state = suggestion.suggestedState;
        }
        if (suggestion.suggestedZip !== null && suggestion.suggestedZip !== undefined) {
          courtUpdateData.zip = suggestion.suggestedZip;
        }
        if (suggestion.suggestedCourtType !== null && suggestion.suggestedCourtType !== undefined) {
          courtUpdateData.court_type = suggestion.suggestedCourtType;
        }
        if (suggestion.suggestedNumberOfCourts !== null && suggestion.suggestedNumberOfCourts !== undefined && suggestion.suggestedNumberOfCourts > 0) {
          courtUpdateData.number_of_courts = suggestion.suggestedNumberOfCourts;
        }
        if (suggestion.suggestedSurface !== null && suggestion.suggestedSurface !== undefined) {
          courtUpdateData.surface = suggestion.suggestedSurface;
        }
        if (suggestion.suggestedCondition !== null && suggestion.suggestedCondition !== undefined) {
          courtUpdateData.court_condition = suggestion.suggestedCondition;
        }

        if (Object.keys(courtUpdateData).length > 0) {
          await db
            .update(courtsSchema)
            .set(courtUpdateData)
            .where(eq(courtsSchema.id, suggestion.courtId));
        }
      }
    }

    // Check if all fields have been processed (approved or rejected)
    if (field) {
      // Get all fields that originally had values
      const originalFieldsWithValues = [
        { field: 'name', value: suggestion.suggestedName },
        { field: 'address', value: suggestion.suggestedAddress },
        { field: 'city', value: suggestion.suggestedCity },
        { field: 'state', value: suggestion.suggestedState },
        { field: 'zip', value: suggestion.suggestedZip },
        { field: 'courtType', value: suggestion.suggestedCourtType },
        { field: 'numberOfCourts', value: suggestion.suggestedNumberOfCourts },
        { field: 'surface', value: suggestion.suggestedSurface },
        { field: 'condition', value: suggestion.suggestedCondition },
      ].filter((item) => {
        if (item.value === null || item.value === undefined || item.value === '') {
          return false;
        }
        if (typeof item.value === 'number' && item.value === 0) {
          return false;
        }
        return true;
      });

      // Get all fields that still have values after clearing the current field
      const remainingFieldsWithValues = originalFieldsWithValues.filter(item =>
        item.field !== field,
      );

      // If this is the last field being processed, mark the suggestion accordingly
      if (remainingFieldsWithValues.length === 0) {
        updateData.status = status === 'rejected' ? 'rejected' : 'approved';
      }
    }

    // Update the suggestion
    const [updatedSuggestion] = await db
      .update(courtEditSuggestionSchema)
      .set(updateData)
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
