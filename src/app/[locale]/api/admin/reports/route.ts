import type { NextRequest } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getCurrentUserId, isAdmin } from '@/libs/AdminUtils';
import { getDb } from '@/libs/DB';
import { reportSchema, reviewSchema } from '@/models/Schema';

// GET: Get all reported reviews for admin management
export async function GET() {
  try {
    const adminCheck = await isAdmin();

    if (!adminCheck) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const db = await getDb();

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

    // Get review details for each report
    const reportsWithDetails = await Promise.all(
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
              createdAt: reviewSchema.createdAt,
            })
            .from(reviewSchema)
            .where(eq(reviewSchema.id, report.reviewId))
            .limit(1);

          if (review.length === 0) {
            return null;
          }

          const reviewData = review[0];

          // Get court info from the courts table
          let courtInfo = [];
          try {
            const courtResult = await db.execute(
              `SELECT name, address FROM courts WHERE id = '${reviewData.courtId}' LIMIT 1`,
            );
            if (courtResult && courtResult.length > 0) {
              courtInfo = courtResult;
            } else {
              courtInfo = [{ name: 'Unknown Court', address: 'Address not available' }];
            }
          } catch {
            // Use fallback court info
            courtInfo = [{ name: 'Unknown Court', address: 'Address not available' }];
          }

          return {
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
            reviewPhotos: reviewData.photos ? JSON.parse(reviewData.photos) : [],
            reviewCreatedAt: reviewData.createdAt,
            courtName: courtInfo[0]?.name || `Court ${reviewData.courtId.slice(0, 8)}...`,
            courtAddress: courtInfo[0]?.address || 'Address not available',
          };
        } catch (error) {
          console.error('Error enriching report data:', error);
          return null;
        }
      }),
    );

    // Filter out null values
    const validReports = reportsWithDetails.filter(Boolean);

    return NextResponse.json(validReports);
  } catch (error) {
    console.error('Error in admin reports API:', error);
    return NextResponse.json({ error: 'Failed to fetch reported reviews' }, { status: 500 });
  }
}

// POST: Resolve a report (dismiss or take action)
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

    const { reportId, action, resolutionNote, deleteReview } = await request.json();

    if (!reportId || !action) {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
    }

    const db = await getDb();

    // Get the report
    const reportRecord = await db
      .select()
      .from(reportSchema)
      .where(eq(reportSchema.id, reportId))
      .limit(1);

    if (reportRecord.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const report = reportRecord[0];

    // Update report status
    await db
      .update(reportSchema)
      .set({
        status: action === 'dismiss' ? 'dismissed' : 'resolved',
        resolvedBy: adminUserId,
        resolutionNote: resolutionNote || null,
        resolvedAt: new Date(),
      })
      .where(eq(reportSchema.id, reportId));

    // If action is to delete the review
    if (action === 'delete_review' && deleteReview) {
      await db
        .delete(reviewSchema)
        .where(eq(reviewSchema.id, report.reviewId));
    }

    return NextResponse.json({
      success: true,
      message: `Report ${action === 'dismiss' ? 'dismissed' : 'resolved'} successfully`,
    });
  } catch (error) {
    console.error('Error resolving report:', error);
    return NextResponse.json({ error: 'Failed to resolve report' }, { status: 500 });
  }
}
