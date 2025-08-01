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

  // Check specifically for reports of this photo by this user
  const reportsForThisPhoto = await db
    .select()
    .from(courtPhotoReportSchema)
    .where(eq(courtPhotoReportSchema.courtPhotoId, photoId))
    .where(eq(courtPhotoReportSchema.reportedBy, userId));

  // Only block if there's a pending report for this exact photo
  const pendingReportForThisPhoto = reportsForThisPhoto.find((report: any) =>
    report.status === 'pending' && report.courtPhotoId === photoId,
  );

  if (pendingReportForThisPhoto) {
    return NextResponse.json({ error: 'You have already reported this photo' }, { status: 400 });
  }

  // Create the report
  const report = await db.insert(courtPhotoReportSchema).values({
    courtPhotoId: photoId,
    reportedBy: userId,
    reportedByUserName: userName,
    reason,
  }).returning();

  return NextResponse.json(report[0]);
}
