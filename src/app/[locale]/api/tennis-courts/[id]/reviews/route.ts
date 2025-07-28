import type { NextRequest } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getDb } from '@/libs/DB';
import { deletePhotosFromUrls } from '@/libs/DigitalOceanSpaces';
import { photoModerationSchema, reviewSchema } from '@/models/Schema';

// GET: List all reviews for a court
export async function GET(_req: NextRequest, context: { params: { id: string } }) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: 'Invalid court id' }, { status: 400 });
  }
  const db = await getDb();
  const reviews = await db
    .select()
    .from(reviewSchema)
    .where(eq(reviewSchema.courtId, id));
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
  const { rating, text, photos } = await req.json();
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
    photos: photos ? JSON.stringify(photos) : null,
  }).returning();

  // Track photos for admin management if photos are provided
  if (photos && Array.isArray(photos) && photos.length > 0) {
    try {
      const photoEntries = photos.map((photoUrl: string) => ({
        photoUrl,
        reviewId: review[0].id,
        courtId: id,
        uploadedBy: userId,
        isDeleted: false,
      }));

      await db.insert(photoModerationSchema).values(photoEntries);
    } catch (error) {
      console.error('Error tracking photos for moderation:', error);
      // Continue even if photo tracking fails - photos will still be displayed
    }
  }

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
  const { reviewId, rating, text, photos } = await req.json();
  if (!reviewId) {
    return NextResponse.json({ error: 'Missing reviewId' }, { status: 400 });
  }
  // Only allow editing own review
  const db = await getDb();
  const review = await db.select().from(reviewSchema).where(eq(reviewSchema.id, reviewId));
  if (!review[0] || review[0].userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Handle photo changes for moderation
  if (review[0].photos && photos) {
    try {
      const oldPhotoUrls = JSON.parse(review[0].photos) as string[];
      const newPhotoUrls = photos as string[];

      // Find photos that are no longer in the new list
      const photosToDelete = oldPhotoUrls.filter(oldUrl => !newPhotoUrls.includes(oldUrl));

      // Delete removed photos from Cloudinary
      await deletePhotosFromUrls(photosToDelete);

      // Remove deleted photos from tracking
      if (photosToDelete.length > 0) {
        try {
          for (const photoUrl of photosToDelete) {
            await db.delete(photoModerationSchema)
              .where(eq(photoModerationSchema.reviewId, reviewId))
              .where(eq(photoModerationSchema.photoUrl, photoUrl));
          }
        } catch (error) {
          console.error('Error removing photos from tracking:', error);
          // Continue even if photo tracking cleanup fails
        }
      }

      // Add new photos to tracking
      const newPhotos = newPhotoUrls.filter(newUrl => !oldPhotoUrls.includes(newUrl));
      if (newPhotos.length > 0) {
        try {
          const photoEntries = newPhotos.map((photoUrl: string) => ({
            photoUrl,
            reviewId,
            courtId: id,
            uploadedBy: userId,
            isDeleted: false,
          }));

          await db.insert(photoModerationSchema).values(photoEntries);
        } catch (error) {
          console.error('Error tracking new photos for moderation:', error);
          // Continue even if photo tracking fails
        }
      }
    } catch (error) {
      console.error('Error handling photo changes:', error);
      // Continue with review update even if photo handling fails
    }
  }

  const updated = await db.update(reviewSchema)
    .set({
      rating,
      text,
      photos: photos ? JSON.stringify(photos) : null,
    })
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

  // Delete photos from Cloudinary if they exist
  if (review[0].photos) {
    try {
      const photoUrls = JSON.parse(review[0].photos) as string[];
      await deletePhotosFromUrls(photoUrls);
    } catch (error) {
      console.error('Error deleting photos from Cloudinary:', error);
      // Continue with review deletion even if photo deletion fails
    }
  }

  await db.delete(reviewSchema).where(eq(reviewSchema.id, reviewId));
  return NextResponse.json({ success: true });
}
