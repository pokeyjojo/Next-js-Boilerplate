import type { NextRequest } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getCurrentUserId, isAdmin } from '@/libs/AdminUtils';
import { getDb } from '@/libs/DB';
import { deletePhotosFromUrls } from '@/libs/DigitalOceanSpaces';
import { courtPhotoReportSchema, courtPhotoSchema, courtsSchema } from '@/models/Schema';

// GET: Get reported court photos for admin management
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
          id: courtPhotoReportSchema.id,
          courtPhotoId: courtPhotoReportSchema.courtPhotoId,
          reportedBy: courtPhotoReportSchema.reportedBy,
          reportedByUserName: courtPhotoReportSchema.reportedByUserName,
          reason: courtPhotoReportSchema.reason,
          status: courtPhotoReportSchema.status,
          createdAt: courtPhotoReportSchema.createdAt,
        })
        .from(courtPhotoReportSchema)
        .where(eq(courtPhotoReportSchema.status, 'pending'))
        .orderBy(desc(courtPhotoReportSchema.createdAt));

      // For each reported photo, get its details
      const photosWithReports = await Promise.all(
        reports.map(async (report) => {
          const photo = await db
            .select({
              id: courtPhotoSchema.id,
              photoUrl: courtPhotoSchema.photoUrl,
              uploadedBy: courtPhotoSchema.uploadedBy,
              uploadedByUserName: courtPhotoSchema.uploadedByUserName,
              caption: courtPhotoSchema.caption,
              courtId: courtPhotoSchema.courtId,
              createdAt: courtPhotoSchema.createdAt,
            })
            .from(courtPhotoSchema)
            .where(eq(courtPhotoSchema.id, report.courtPhotoId))
            .where(eq(courtPhotoSchema.isDeleted, false));

          if (photo[0]) {
            // Try to get court info, but handle potential UUID/integer mismatch gracefully
            let courtName = 'Unknown Court';
            let courtAddress = 'Unknown Address';

            try {
              const court = await db
                .select({
                  name: courtsSchema.name,
                  address: courtsSchema.address,
                })
                .from(courtsSchema)
                .where(eq(courtsSchema.id, photo[0].courtId));

              if (court[0]) {
                courtName = court[0].name;
                courtAddress = court[0].address;
              }
            } catch (courtError) {
              console.warn('Could not fetch court info for photo:', photo[0].id, courtError);
              // Continue with default values
            }

            return {
              id: photo[0].id,
              photoUrl: photo[0].photoUrl,
              reportId: report.id,
              reportReason: report.reason,
              reportedBy: report.reportedBy,
              reportedByUserName: report.reportedByUserName,
              reportCreatedAt: report.createdAt,
              uploadedBy: photo[0].uploadedBy,
              uploadedByUserName: photo[0].uploadedByUserName,
              caption: photo[0].caption,
              courtName,
              courtAddress,
              createdAt: photo[0].createdAt,
            };
          }
          return null;
        }),
      );

      reportedPhotos = photosWithReports.filter(Boolean);
    } catch (error) {
      console.error('Error fetching reported court photos:', error);
    }

    return NextResponse.json(reportedPhotos);
  } catch (error) {
    console.error('Error in GET /api/admin/court-photos:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Delete a reported court photo or dismiss a report
export async function POST(req: NextRequest) {
  try {
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { photoId, reportId, action, reason } = await req.json();
    const adminUserId = await getCurrentUserId();

    if (!photoId && !reportId) {
      return NextResponse.json({ error: 'Photo ID or Report ID is required' }, { status: 400 });
    }

    const db = await getDb();

    if (action === 'dismiss_report' && reportId) {
      // Dismiss the report
      await db.update(courtPhotoReportSchema)
        .set({
          status: 'dismissed',
          resolvedBy: adminUserId,
          resolutionNote: reason || 'Report dismissed by admin',
          resolvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(courtPhotoReportSchema.id, reportId))
        .where(eq(courtPhotoReportSchema.status, 'pending'));

      return NextResponse.json({ success: true, message: 'Report dismissed successfully' });
    }

    if (action === 'delete_photo' && photoId) {
      // Get the photo details
      const photo = await db
        .select()
        .from(courtPhotoSchema)
        .where(eq(courtPhotoSchema.id, photoId))
        .where(eq(courtPhotoSchema.isDeleted, false));

      if (!photo[0]) {
        return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
      }

      // Delete the photo from DigitalOcean Spaces
      try {
        await deletePhotosFromUrls([photo[0].photoUrl]);
      } catch (error) {
        console.error('Error deleting photo from DigitalOcean Spaces:', error);
        // Continue with database deletion even if file deletion fails
      }

      // Mark the photo as deleted
      await db.update(courtPhotoSchema)
        .set({
          isDeleted: true,
          deletedBy: adminUserId,
          deletionReason: reason || 'Reported content',
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(courtPhotoSchema.id, photoId));

      // Mark all pending reports for this photo as resolved
      await db.update(courtPhotoReportSchema)
        .set({
          status: 'resolved',
          resolvedBy: adminUserId,
          resolutionNote: 'Photo deleted by admin',
          resolvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(courtPhotoReportSchema.courtPhotoId, photoId))
        .where(eq(courtPhotoReportSchema.status, 'pending'));

      return NextResponse.json({ success: true, message: 'Photo deleted successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in POST /api/admin/court-photos:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
