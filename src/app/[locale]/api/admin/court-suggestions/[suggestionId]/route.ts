import type { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/libs/AdminUtils';
import { getDb } from '@/libs/DB';
import { courtsSchema, newCourtSuggestionSchema } from '@/models/Schema';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ suggestionId: string }> },
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { suggestionId } = await params;
    const body = await request.json();
    const { action, reviewNote } = body;

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 },
      );
    }

    const db = await getDb();

    const userResponse = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
    });

    let adminUserName = 'Unknown Admin';
    if (userResponse.ok) {
      const userData = await userResponse.json();
      adminUserName = userData.first_name && userData.last_name
        ? `${userData.first_name} ${userData.last_name}`
        : userData.username || userData.email_addresses?.[0]?.email_address || 'Unknown Admin';
    }

    const suggestion = await db
      .select()
      .from(newCourtSuggestionSchema)
      .where(eq(newCourtSuggestionSchema.id, suggestionId))
      .limit(1);

    if (!suggestion.length) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
    }

    const suggestionData = suggestion[0];

    if (suggestionData.status !== 'pending') {
      return NextResponse.json(
        { error: 'Can only review pending suggestions' },
        { status: 400 },
      );
    }

    if (action === 'approve') {
      await db.insert(courtsSchema).values({
        name: suggestionData.name,
        address: suggestionData.address,
        city: suggestionData.city,
        state: suggestionData.state,
        zip: suggestionData.zip,
        latitude: suggestionData.latitude,
        longitude: suggestionData.longitude,
        courtType: suggestionData.courtType,
        numberOfCourts: suggestionData.numberOfCourts,
        surface: suggestionData.surface,
        courtCondition: suggestionData.courtCondition,
        hittingWall: suggestionData.hittingWall ?? false,
        lighted: suggestionData.lighted ?? false,
        membershipRequired: suggestionData.membershipRequired ?? false,
        parking: suggestionData.parking ?? false,
      });
    }

    await db
      .update(newCourtSuggestionSchema)
      .set({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewedBy: userId,
        reviewedByUserName: adminUserName,
        reviewNote: reviewNote || null,
        reviewedAt: new Date(),
      })
      .where(eq(newCourtSuggestionSchema.id, suggestionId));

    return NextResponse.json({
      success: true,
      message: `Court suggestion ${action}d successfully`,
    });
  } catch (error) {
    console.error('Error reviewing court suggestion:', error);
    return NextResponse.json(
      { error: 'Failed to review court suggestion' },
      { status: 500 },
    );
  }
}
