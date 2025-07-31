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
      suggestedCondition,
      suggestedType,
      suggestedHittingWall,
      suggestedLights,
    } = body;

    // Check if court exists using the courts schema (UUID)
    const [court] = await db.select().from(courtsSchema).where(eq(courtsSchema.id, courtId)).limit(1);
    if (!court) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 });
    }

    // Validate reason field length
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
    }
    if (reason.trim().length > 100) {
      return NextResponse.json({ error: 'Reason must be 100 characters or less' }, { status: 400 });
    }

    // Check if any suggested values are different from current values
    const hasChanges = (
      (suggestedName && suggestedName !== court.name)
      || (suggestedAddress && suggestedAddress !== court.address)
      || (suggestedCity && suggestedCity !== court.city)
      || (suggestedState && suggestedState !== court.state)
      || (suggestedZip && suggestedZip !== court.zip)
      || (suggestedCourtType && suggestedCourtType !== court.courtType)
      || (suggestedNumberOfCourts !== null && suggestedNumberOfCourts !== undefined && suggestedNumberOfCourts !== court.numberOfCourts)
      || (suggestedSurface && suggestedSurface !== court.surface)
      || (suggestedCondition && suggestedCondition !== court.courtCondition)
      || (suggestedType && suggestedType !== court.courtType)
      || (suggestedHittingWall !== null && suggestedHittingWall !== undefined && suggestedHittingWall !== court.hittingWall)
      || (suggestedLights !== null && suggestedLights !== undefined && suggestedLights !== court.lighted)
    );

    // Validate suggestedNumberOfCourts to prevent extremely large numbers
    if (suggestedNumberOfCourts !== null && suggestedNumberOfCourts !== undefined) {
      const numCourts = Number(suggestedNumberOfCourts);
      if (Number.isNaN(numCourts) || numCourts < 0 || numCourts > 1000) {
        return NextResponse.json(
          { error: 'Number of courts must be between 0 and 1000' },
          { status: 400 },
        );
      }
    }

    if (!hasChanges) {
      return NextResponse.json(
        { error: 'No changes detected. All suggested values match current values.' },
        { status: 400 },
      );
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

    // Create the suggestion with only the fields that are different
    const suggestionData: any = {
      courtId,
      suggestedBy: userId,
      suggestedByUserName: 'User', // Simplified for now
      reason,
    };

    // Only include fields that are different from current values
    if (suggestedName && suggestedName !== court.name) {
      suggestionData.suggestedName = suggestedName;
    }
    if (suggestedAddress && suggestedAddress !== court.address) {
      suggestionData.suggestedAddress = suggestedAddress;
    }
    if (suggestedCity && suggestedCity !== court.city) {
      suggestionData.suggestedCity = suggestedCity;
    }
    if (suggestedState && suggestedState !== court.state) {
      suggestionData.suggestedState = suggestedState;
    }
    if (suggestedZip && suggestedZip !== court.zip) {
      suggestionData.suggestedZip = suggestedZip;
    }
    if (suggestedCourtType && suggestedCourtType !== court.courtType) {
      suggestionData.suggestedCourtType = suggestedCourtType;
    }
    if (suggestedNumberOfCourts !== null && suggestedNumberOfCourts !== undefined && suggestedNumberOfCourts !== court.numberOfCourts) {
      suggestionData.suggestedNumberOfCourts = suggestedNumberOfCourts;
    }
    if (suggestedSurface && suggestedSurface !== court.surface) {
      suggestionData.suggestedSurface = suggestedSurface;
    }
    if (suggestedCondition && suggestedCondition !== court.courtCondition) {
      suggestionData.suggestedCondition = suggestedCondition;
    }
    if (suggestedType && suggestedType !== court.courtType) {
      suggestionData.suggestedType = suggestedType;
    }
    if (suggestedHittingWall !== null && suggestedHittingWall !== undefined && suggestedHittingWall !== court.hittingWall) {
      suggestionData.suggestedHittingWall = suggestedHittingWall;
    }
    if (suggestedLights !== null && suggestedLights !== undefined && suggestedLights !== court.lighted) {
      suggestionData.suggestedLights = suggestedLights;
    }

    const [suggestion] = await db
      .insert(courtEditSuggestionSchema)
      .values(suggestionData)
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
    const includeAll = searchParams.get('includeAll') === 'true';
    const filterUserId = searchParams.get('userId');
    const limit = searchParams.get('limit');

    // Get current court data
    const [court] = await db.select().from(courtsSchema).where(eq(courtsSchema.id, courtId)).limit(1);
    if (!court) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 });
    }

    const whereConditions = [eq(courtEditSuggestionSchema.courtId, courtId)];

    if (status) {
      whereConditions.push(eq(courtEditSuggestionSchema.status, status));
    }

    // Add user filter if filterUserId is provided
    if (filterUserId) {
      whereConditions.push(eq(courtEditSuggestionSchema.suggestedBy, filterUserId));
    }

    let query = db
      .select()
      .from(courtEditSuggestionSchema)
      .where(and(...whereConditions))
      .orderBy(courtEditSuggestionSchema.createdAt);

    // Add limit if specified
    if (limit) {
      query = query.limit(Number.parseInt(limit));
    }

    const suggestions = await query;

    // Skip filtering if includeAll is true (for checking user's own suggestions)
    if (includeAll) {
      return NextResponse.json(suggestions);
    }

    // Filter out suggestions where suggested values match current values
    const filteredSuggestions = suggestions.filter((suggestion: any) => {
      // Helper function to normalize strings for comparison
      const normalizeString = (str: string | null | undefined) => {
        if (str === null || str === undefined) {
          return null;
        }
        const normalized = str.toString().trim().toLowerCase();
        return normalized === '' ? null : normalized;
      };

      // Check each field individually and only keep suggestions that have at least one field with changes
      const nameHasChanges = !!(suggestion.suggestedName && normalizeString(suggestion.suggestedName) !== normalizeString(court.name));
      const addressHasChanges = !!(suggestion.suggestedAddress && normalizeString(suggestion.suggestedAddress) !== normalizeString(court.address));
      const cityHasChanges = !!(suggestion.suggestedCity && normalizeString(suggestion.suggestedCity) !== normalizeString(court.city));
      const stateHasChanges = !!(suggestion.suggestedState && normalizeString(suggestion.suggestedState) !== normalizeString(court.state));
      const zipHasChanges = !!(suggestion.suggestedZip && normalizeString(suggestion.suggestedZip) !== normalizeString(court.zip));
      const courtTypeHasChanges = !!(suggestion.suggestedCourtType && normalizeString(suggestion.suggestedCourtType) !== normalizeString(court.courtType));
      const numberOfCourtsHasChanges = !!(suggestion.suggestedNumberOfCourts !== null && suggestion.suggestedNumberOfCourts !== undefined && suggestion.suggestedNumberOfCourts !== court.numberOfCourts);
      const surfaceHasChanges = !!(suggestion.suggestedSurface && normalizeString(suggestion.suggestedSurface) !== normalizeString(court.surface));
      const conditionHasChanges = !!(suggestion.suggestedCondition && normalizeString(suggestion.suggestedCondition) !== normalizeString(court.courtCondition));
      const typeHasChanges = !!(suggestion.suggestedType && normalizeString(suggestion.suggestedType) !== normalizeString(court.courtType));
      const hittingWallHasChanges = !!(suggestion.suggestedHittingWall !== null && suggestion.suggestedHittingWall !== undefined && suggestion.suggestedHittingWall !== court.hittingWall);
      const lightsHasChanges = !!(suggestion.suggestedLights !== null && suggestion.suggestedLights !== undefined && suggestion.suggestedLights !== court.lighted);

      const hasAnyChanges = nameHasChanges || addressHasChanges || cityHasChanges || stateHasChanges || zipHasChanges || courtTypeHasChanges || numberOfCourtsHasChanges || surfaceHasChanges || conditionHasChanges || typeHasChanges || hittingWallHasChanges || lightsHasChanges;

      // If there are changes, create a new suggestion object with only the fields that have changes
      if (hasAnyChanges) {
        const filteredSuggestion = { ...suggestion };

        // Clear fields that don't have changes
        if (!nameHasChanges) {
          filteredSuggestion.suggestedName = null;
        }
        if (!addressHasChanges) {
          filteredSuggestion.suggestedAddress = null;
        }
        if (!cityHasChanges) {
          filteredSuggestion.suggestedCity = null;
        }
        if (!stateHasChanges) {
          filteredSuggestion.suggestedState = null;
        }
        if (!zipHasChanges) {
          filteredSuggestion.suggestedZip = null;
        }
        if (!courtTypeHasChanges) {
          filteredSuggestion.suggestedCourtType = null;
        }
        if (!numberOfCourtsHasChanges) {
          filteredSuggestion.suggestedNumberOfCourts = null;
        }
        if (!surfaceHasChanges) {
          filteredSuggestion.suggestedSurface = null;
        }
        if (!conditionHasChanges) {
          filteredSuggestion.suggestedCondition = null;
        }
        if (!typeHasChanges) {
          filteredSuggestion.suggestedType = null;
        }
        if (!hittingWallHasChanges) {
          filteredSuggestion.suggestedHittingWall = null;
        }
        if (!lightsHasChanges) {
          filteredSuggestion.suggestedLights = null;
        }

        // Replace the original suggestion with the filtered one
        Object.assign(suggestion, filteredSuggestion);
      }

      return hasAnyChanges;
    });

    return NextResponse.json(filteredSuggestions);
  } catch (error) {
    console.error('Error fetching court edit suggestions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
