import type { NextRequest } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/libs/AdminUtils';
import { checkUserBan } from '@/libs/BanCheck';
import { getDb } from '@/libs/DB';
import { deletePhotosFromUrls } from '@/libs/DigitalOceanSpaces';
import { courtPhotoSchema } from '@/models/Schema';

// GET: List all photos for a court (excluding deleted ones)
export async function GET(_req: NextRequest, context: { params: { id: string } }) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: 'Invalid court id' }, { status: 400 });
  }

  const db = await getDb();
  const photos = await db
    .select()
    .from(courtPhotoSchema)
    .where(eq(courtPhotoSchema.courtId, id))
    .where(eq(courtPhotoSchema.isDeleted, false))
    .orderBy(desc(courtPhotoSchema.createdAt));

  return NextResponse.json(photos);
}

// POST: Upload a new photo to a court
export async function POST(req: NextRequest, context: { params: { id: string } }) {
  // Check if user is banned from photos
  const banCheck = await checkUserBan();
  if (banCheck.response) {
    return banCheck.response;
  }

  const user = banCheck.user;
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;
  const userName = user.fullName || user.username || user.primaryEmailAddress?.emailAddress || user.id;
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: 'Invalid court id' }, { status: 400 });
  }

  const { photoUrl, caption } = await req.json();

  if (!photoUrl) {
    return NextResponse.json({ error: 'Photo URL is required' }, { status: 400 });
  }

  const db = await getDb();
  const photo = await db.insert(courtPhotoSchema).values({
    courtId: id,
    photoUrl,
    uploadedBy: userId,
    uploadedByUserName: userName,
    caption: caption || null,
  }).returning();

  return NextResponse.json(photo[0]);
}

// PUT: Update a photo (only by uploader or admin)
export async function PUT(req: NextRequest, context: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;
  const { id } = await context.params;
  const { photoId, caption } = await req.json();

  if (!id || !photoId) {
    return NextResponse.json({ error: 'Invalid court id or photo id' }, { status: 400 });
  }

  const db = await getDb();
  const photo = await db.select().from(courtPhotoSchema).where(eq(courtPhotoSchema.id, photoId));

  if (!photo[0]) {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
  }

  const adminCheck = await isAdmin();
  if (photo[0].uploadedBy !== userId && !adminCheck) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const updated = await db.update(courtPhotoSchema)
    .set({
      caption: caption || null,
      updatedAt: new Date(),
    })
    .where(eq(courtPhotoSchema.id, photoId))
    .returning();

  return NextResponse.json(updated[0]);
}

// DELETE: Delete a photo (only by uploader or admin)
export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;
  const { id } = await context.params;
  const { photoId, reason } = await req.json();

  if (!id || !photoId) {
    return NextResponse.json({ error: 'Invalid court id or photo id' }, { status: 400 });
  }

  const db = await getDb();
  const photo = await db.select().from(courtPhotoSchema).where(eq(courtPhotoSchema.id, photoId));

  if (!photo[0]) {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
  }

  const adminCheck = await isAdmin();
  if (photo[0].uploadedBy !== userId && !adminCheck) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Delete the photo from DigitalOcean Spaces
  try {
    await deletePhotosFromUrls([photo[0].photoUrl]);
  } catch (error) {
    console.error('Error deleting photo from DigitalOcean Spaces:', error);
    // Continue with database deletion even if file deletion fails
  }

  // Mark as deleted in database
  const deleted = await db.update(courtPhotoSchema)
    .set({
      isDeleted: true,
      deletedBy: userId,
      deletionReason: reason || null,
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(courtPhotoSchema.id, photoId))
    .returning();

  return NextResponse.json(deleted[0]);
}
