import type { NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getDb } from '@/libs/DB';
import { photoModerationSchema, reviewSchema } from '@/models/Schema';

// GET: List all reviews for a court with non-deleted photos
export async function GET(_req: NextRequest, context: { params: { id: string } }) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: 'Invalid court id' }, { status: 400 });
  }

  const db = await getDb();

  // Get all reviews for the court
  const reviews = await db
    .select()
    .from(reviewSchema)
    .where(eq(reviewSchema.courtId, id));

  // Get non-deleted photos for each review
  const reviewsWithActivePhotos = await Promise.all(
    reviews.map(async (review: any) => {
      if (!review.photos) {
        return review;
      }

      try {
        const allPhotoUrls = JSON.parse(review.photos) as string[];

        // Get non-deleted photos for this review
        const activePhotos = await db
          .select({ photoUrl: photoModerationSchema.photoUrl })
          .from(photoModerationSchema)
          .where(
            and(
              eq(photoModerationSchema.reviewId, review.id),
              eq(photoModerationSchema.isDeleted, false),
            ),
          );

        const activePhotoUrls = activePhotos.map((p: any) => p.photoUrl);

        // If no photos are tracked in moderation table, show all photos (backward compatibility)
        // If photos are tracked, only show non-deleted ones
        const filteredPhotos = activePhotoUrls.length > 0
          ? allPhotoUrls.filter(url => activePhotoUrls.includes(url))
          : allPhotoUrls;

        return {
          ...review,
          photos: filteredPhotos.length > 0 ? JSON.stringify(filteredPhotos) : null,
        };
      } catch (error) {
        console.error('Error processing photos for review:', review.id, error);
        return {
          ...review,
          photos: null, // Remove photos if there's an error
        };
      }
    }),
  );

  return NextResponse.json(reviewsWithActivePhotos);
}
