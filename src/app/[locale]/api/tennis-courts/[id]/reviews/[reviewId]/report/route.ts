import type { NextRequest } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getDb } from '@/libs/DB';
import { reportSchema, reviewSchema } from '@/models/Schema';

// POST: Report a review
export async function POST(
  req: NextRequest,
  context: { params: { id: string; reviewId: string } },
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: courtId, reviewId } = await context.params;
    const { reason } = await req.json();

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
    }

    if (reason.trim().length > 500) {
      return NextResponse.json({ error: 'Reason must be 500 characters or less' }, { status: 400 });
    }

    const db = await getDb();

    // Check if the review exists
    const review = await db
      .select()
      .from(reviewSchema)
      .where(eq(reviewSchema.id, reviewId))
      .where(eq(reviewSchema.courtId, courtId));

    if (review.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Check if user has already reported this review
    const existingReport = await db
      .select()
      .from(reportSchema)
      .where(and(
        eq(reportSchema.reviewId, reviewId),
        eq(reportSchema.reportedBy, user.id),
      ));

    if (existingReport.length > 0) {
      return NextResponse.json({ error: 'You have already reported this review' }, { status: 400 });
    }

    // Create the report
    const report = await db.insert(reportSchema).values({
      reviewId,
      reportedBy: user.id,
      reportedByUserName: user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.emailAddresses[0]?.emailAddress || 'Unknown User',
      reason: reason.trim(),
      status: 'pending',
    }).returning();

    return NextResponse.json(report[0]);
  } catch (error) {
    console.error('Error reporting review:', error);
    return NextResponse.json({ error: 'Failed to report review' }, { status: 500 });
  }
}
