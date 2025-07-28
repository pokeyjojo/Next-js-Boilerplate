import type { NextRequest } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getCurrentUserId, isAdmin } from '@/libs/AdminUtils';
import { getDb } from '@/libs/DB';
import { deletePhotosFromUrls } from '@/libs/DigitalOceanSpaces';
import { photoModerationSchema, reportSchema, reviewSchema, tennisCourtSchema } from '@/models/Schema';

// GET: Get reported photos for admin management
export async function GET() {
  try {
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const db = await getDb();
    let reportedPhotos: any[] = [];

    try {
      // Get all reports with pending status
      const reports = await db
        .select({
          id: reportSchema.id,
          reviewId: reportSchema.reviewId,
          reportedBy: reportSchema.reportedBy,
          reportedByUserName: reportSchema.reportedByUserName,
          reason: reportSchema.reason,
          status: reportSchema.status,
          createdAt: reportSchema.createdAt,
        })
        .from(reportSchema)
        .where(eq(reportSchema.status, 'pending'))
        .orderBy(desc(reportSchema.createdAt));

      // For each reported review, get its photos
      const photosWithReports = await Promise.all(
        reports.map(async (report: any) => {
          try {
            // Get the review
            const review = await db
              .select({
                id: reviewSchema.id,
                text: reviewSchema.text,
                rating: reviewSchema.rating,
                photos: reviewSchema.photos,
                userId: reviewSchema.userId,
                userName: reviewSchema.userName,
                courtId: reviewSchema.courtId,
                isDeleted: reviewSchema.isDeleted,
              })
              .from(reviewSchema)
              .where(eq(reviewSchema.id, report.reviewId))
              .limit(1);

            if (review.length === 0 || review[0].isDeleted) {
              return null;
            }

            const reviewData = review[0];

            // Get court info - handle potential type mismatch
            let courtInfo = [];
            try {
              courtInfo = await db
                .select({ name: tennisCourtSchema.name, address: tennisCourtSchema.address })
                .from(tennisCourtSchema)
                .where(eq(tennisCourtSchema.id, reviewData.courtId))
                .limit(1);
            } catch (error) {
              console.error('Error fetching court info:', error);
              // If there's a type mismatch, try to get court info from the photo_moderation table
              try {
                const photoWithCourt = await db
                  .select({
                    courtName: photoModerationSchema.courtId,
                    courtAddress: photoModerationSchema.courtId,
                  })
                  .from(photoModerationSchema)
                  .where(eq(photoModerationSchema.reviewId, reviewData.id))
                  .limit(1);

                if (photoWithCourt.length > 0) {
                  courtInfo = [{ name: `Court ${photoWithCourt[0].courtName}`, address: 'Address not available' }];
                }
              } catch (fallbackError) {
                console.error('Fallback court info fetch failed:', fallbackError);
              }
            }

            // Get photos for this review
            const photos = await db
              .select({
                id: photoModerationSchema.id,
                photoUrl: photoModerationSchema.photoUrl,
                isDeleted: photoModerationSchema.isDeleted,
                deletedBy: photoModerationSchema.deletedBy,
                deletionReason: photoModerationSchema.deletionReason,
                deletedAt: photoModerationSchema.deletedAt,
                createdAt: photoModerationSchema.createdAt,
              })
              .from(photoModerationSchema)
              .where(eq(photoModerationSchema.reviewId, reviewData.id));

            // Return photos with report and review context
            return photos
              .filter((photo: any) => !photo.isDeleted) // Only show non-deleted photos
              .map((photo: any) => ({
                ...photo,
                reportId: report.id,
                reportReason: report.reason,
                reportedBy: report.reportedBy,
                reportedByUserName: report.reportedByUserName,
                reportCreatedAt: report.createdAt,
                reviewId: reviewData.id,
                reviewText: reviewData.text || '',
                reviewRating: reviewData.rating || 0,
                reviewUserId: reviewData.userId,
                reviewUserName: reviewData.userName,
                courtName: courtInfo[0]?.name || 'Unknown Court',
                courtAddress: courtInfo[0]?.address || 'No address',
              }));
          } catch (error) {
            console.error('Error enriching photo data:', error);
            return [];
          }
        }),
      );

      // Flatten the array and filter out null values
      reportedPhotos = photosWithReports.flat().filter(Boolean);
    } catch (error) {
      console.error('Error fetching reported photos:', error);
      // Return empty array if there's an error
    }

    return NextResponse.json(reportedPhotos);
  } catch (error) {
    console.error('Error in admin photos API:', error);
    return NextResponse.json({ error: 'Failed to fetch reported photos' }, { status: 500 });
  }
}

// POST: Delete a photo from a reported review
export async function POST(request: NextRequest) {
  try {
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const adminUserId = await getCurrentUserId();
    if (!adminUserId) {
      return NextResponse.json({ error: 'Admin user ID not found' }, { status: 401 });
    }

    const { photoId, reason } = await request.json();
    if (!photoId) {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
    }

    const db = await getDb();
    const photoRecord = await db.select().from(photoModerationSchema).where(eq(photoModerationSchema.id, photoId));

    if (photoRecord.length === 0) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    const photo = photoRecord[0];
    if (photo.isDeleted) {
      return NextResponse.json({ error: 'Photo is already deleted' }, { status: 400 });
    }

    // Delete photo from DigitalOcean Spaces
    try {
      await deletePhotosFromUrls([photo.photoUrl]);
    } catch (error) {
      console.error('Error deleting photo from DigitalOcean Spaces:', error);
      // Continue with deletion even if DigitalOcean Spaces deletion fails
    }

    // Mark photo as deleted in database
    await db
      .update(photoModerationSchema)
      .set({
        isDeleted: true,
        deletedBy: adminUserId,
        deletionReason: reason || 'Photo deleted by admin due to report',
        deletedAt: new Date(),
      })
      .where(eq(photoModerationSchema.id, photoId));

    return NextResponse.json({ success: true, message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 });
  }
}
