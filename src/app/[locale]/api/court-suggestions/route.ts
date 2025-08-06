import type { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { and, desc, eq, ilike } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { checkUserBan } from '@/libs/BanCheck';
import { getDb } from '@/libs/DB';
import { geocodeAddress } from '@/libs/GeocodingService';
import { courtsSchema, newCourtSuggestionSchema } from '@/models/Schema';

export async function POST(request: NextRequest) {
  try {
    // Check if user is banned from submitting content
    const banCheck = await checkUserBan();
    if (banCheck.response) {
      return banCheck.response;
    }

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const body = await request.json();

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
      membershipRequired,
      parking,
    } = body;

    if (!name || !address || !city || !state || !zip) {
      return NextResponse.json(
        { error: 'Name, address, city, state, and zip are required' },
        { status: 400 },
      );
    }

    // Check for duplicate address in existing courts
    const existingCourt = await db
      .select()
      .from(courtsSchema)
      .where(
        and(
          ilike(courtsSchema.address, address),
          ilike(courtsSchema.city, city),
          ilike(courtsSchema.state, state),
          eq(courtsSchema.zip, zip),
        ),
      )
      .limit(1);

    if (existingCourt.length > 0) {
      return NextResponse.json(
        { error: 'A court with this address already exists' },
        { status: 409 },
      );
    }

    // Check for existing pending suggestion with same address
    const existingSuggestion = await db
      .select()
      .from(newCourtSuggestionSchema)
      .where(
        and(
          ilike(newCourtSuggestionSchema.address, address),
          ilike(newCourtSuggestionSchema.city, city),
          ilike(newCourtSuggestionSchema.state, state),
          eq(newCourtSuggestionSchema.zip, zip),
          eq(newCourtSuggestionSchema.status, 'pending'),
        ),
      )
      .limit(1);

    if (existingSuggestion.length > 0) {
      return NextResponse.json(
        { error: 'Someone has already suggested a court with this address' },
        { status: 409 },
      );
    }

    const coordinates = await geocodeAddress(address, city, state, zip);

    if (!coordinates) {
      return NextResponse.json(
        { error: 'Invalid address' },
        { status: 400 },
      );
    }

    const userResponse = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
    });

    let userName = 'Unknown User';
    if (userResponse.ok) {
      const userData = await userResponse.json();
      userName = userData.first_name && userData.last_name
        ? `${userData.first_name} ${userData.last_name}`
        : userData.username || userData.email_addresses?.[0]?.email_address || 'Unknown User';
    }

    const suggestion = await db.insert(newCourtSuggestionSchema).values({
      suggestedBy: userId,
      suggestedByUserName: userName,
      name,
      address,
      city,
      state,
      zip,
      latitude: coordinates.latitude.toString(),
      longitude: coordinates.longitude.toString(),
      courtType: courtType || null,
      numberOfCourts: numberOfCourts || null,
      surface: surface || null,
      courtCondition: courtCondition || null,
      hittingWall: hittingWall || null,
      lighted: lighted || null,
      membershipRequired: membershipRequired || null,
      parking: parking || null,
    }).returning();

    return NextResponse.json({ success: true, suggestion: suggestion[0] });
  } catch (error) {
    console.error('Error creating court suggestion:', error);
    return NextResponse.json(
      { error: 'Failed to create court suggestion' },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const suggestions = await db
      .select()
      .from(newCourtSuggestionSchema)
      .where(eq(newCourtSuggestionSchema.suggestedBy, userId))
      .orderBy(desc(newCourtSuggestionSchema.createdAt));

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Error fetching court suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch court suggestions' },
      { status: 500 },
    );
  }
}
