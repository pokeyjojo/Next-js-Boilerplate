import type { NextRequest } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getDb } from '@/libs/DB';
import { courtPhotoReportSchema, courtPhotoSchema } from '@/models/Schema';

// POST: Report a court photo
export async function POST(req: NextRequest, context: { params: { id: string; photoId: string } }) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;
  const userName = user.fullName || user.username || user.primaryEmailAddress?.emailAddress || user.id;
  const { id, photoId } = await context.params;

  console.warn('Photo report request:', {
    courtId: id,
    photoId,
    userId,
    userName,
  });

  if (!id || !photoId) {
    return NextResponse.json({ error: 'Invalid court id or photo id' }, { status: 400 });
  }

  const { reason } = await req.json();

  if (!reason) {
    return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
  }

  const db = await getDb();

  // Check if photo exists and is not deleted
  const photo = await db
    .select()
    .from(courtPhotoSchema)
    .where(eq(courtPhotoSchema.id, photoId))
    .where(eq(courtPhotoSchema.isDeleted, false));

  if (!photo[0]) {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
  }

  // Check if user has already reported this photo
  const existingReport = await db
    .select()
    .from(courtPhotoReportSchema)
    .where(eq(courtPhotoReportSchema.courtPhotoId, photoId))
    .where(eq(courtPhotoReportSchema.reportedBy, userId))
    .where(eq(courtPhotoReportSchema.status, 'pending'));

  console.warn('Photo report check:', {
    photoId,
    userId,
    existingReport: existingReport.length,
    existingReportData: existingReport[0],
  });

  // Also check all reports by this user for debugging
  const allUserReports = await db
    .select()
    .from(courtPhotoReportSchema)
    .where(eq(courtPhotoReportSchema.reportedBy, userId));

  console.warn('All user reports:', {
    userId,
    totalReports: allUserReports.length,
    reports: allUserReports.map((r: any) => ({ photoId: r.courtPhotoId, status: r.status })),
  });

  // Check specifically for reports of this photo by this user
  const reportsForThisPhoto = await db
    .select()
    .from(courtPhotoReportSchema)
    .where(eq(courtPhotoReportSchema.courtPhotoId, photoId))
    .where(eq(courtPhotoReportSchema.reportedBy, userId));

  console.warn('Reports for this specific photo:', {
    photoId,
    userId,
    reportsForThisPhoto: reportsForThisPhoto.length,
    reportsForThisPhotoData: reportsForThisPhoto,
  });

  // Debug: Check if the photoId matches what we expect
  reportsForThisPhoto.forEach((report: any, index: number) => {
    console.warn(`Report ${index}:`, {
      requestedPhotoId: photoId,
      reportPhotoId: report.courtPhotoId,
      matches: report.courtPhotoId === photoId,
      reportId: report.id,
      status: report.status,
    });
  });

  // Only block if there's a pending report for this exact photo
  const pendingReportForThisPhoto = reportsForThisPhoto.find((report: any) =>
    report.status === 'pending' && report.courtPhotoId === photoId,
  );

  if (pendingReportForThisPhoto) {
    console.warn('Found pending report for this photo:', pendingReportForThisPhoto);
    return NextResponse.json({ error: 'You have already reported this photo' }, { status: 400 });
  }

  // Create the report
  console.warn('About to create report with:', {
    courtPhotoId: photoId,
    reportedBy: userId,
    reportedByUserName: userName,
    reason,
  });

  const report = await db.insert(courtPhotoReportSchema).values({
    courtPhotoId: photoId,
    reportedBy: userId,
    reportedByUserName: userName,
    reason,
  }).returning();

  console.warn('Created report:', report[0]);

  // Verify the report was created correctly
  const verifyReport = await db
    .select()
    .from(courtPhotoReportSchema)
    .where(eq(courtPhotoReportSchema.id, report[0].id));

  console.warn('Verification - report in database:', verifyReport[0]);

  return NextResponse.json(report[0]);
}
