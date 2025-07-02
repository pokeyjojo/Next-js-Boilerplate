import type { NextRequest } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getDb } from '@/libs/DB';
import { reviewSchema } from '@/models/Schema';

// GET: List all reviews for a court
export async function GET(req: NextRequest, context: { params: { id: string } }) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: 'Invalid court id' }, { status: 400 });
  }
  const db = await getDb();
  const reviews = await db.select().from(reviewSchema).where(eq(reviewSchema.courtId, id));
  return NextResponse.json(reviews);
}

// POST: Create a new review for a court
export async function POST(req: NextRequest, context: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = user.id;
  const userName
    = user.fullName
      || user.username
      || user.primaryEmailAddress?.emailAddress
      || user.id;
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: 'Invalid court id' }, { status: 400 });
  }
  const { rating, text } = await req.json();
  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });
  }
  const db = await getDb();
  const review = await db.insert(reviewSchema).values({
    courtId: id,
    userId,
    userName,
    rating,
    text,
  }).returning();
  return NextResponse.json(review[0]);
}

// PUT: Edit a review (only by author)
export async function PUT(req: NextRequest, context: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = user.id;
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: 'Invalid court id' }, { status: 400 });
  }
  const { reviewId, rating, text } = await req.json();
  if (!reviewId) {
    return NextResponse.json({ error: 'Missing reviewId' }, { status: 400 });
  }
  // Only allow editing own review
  const db = await getDb();
  const review = await db.select().from(reviewSchema).where(eq(reviewSchema.id, reviewId));
  if (!review[0] || review[0].userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const updated = await db.update(reviewSchema)
    .set({ rating, text })
    .where(eq(reviewSchema.id, reviewId))
    .returning();
  return NextResponse.json(updated[0]);
}

// DELETE: Delete a review (only by author)
export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = user.id;
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: 'Invalid court id' }, { status: 400 });
  }
  const { reviewId } = await req.json();
  if (!reviewId) {
    return NextResponse.json({ error: 'Missing reviewId' }, { status: 400 });
  }
  // Only allow deleting own review
  const db = await getDb();
  const review = await db.select().from(reviewSchema).where(eq(reviewSchema.id, reviewId));
  if (!review[0] || review[0].userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  await db.delete(reviewSchema).where(eq(reviewSchema.id, reviewId));
  return NextResponse.json({ success: true });
}
