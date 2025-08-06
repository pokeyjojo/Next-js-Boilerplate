import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { isAdmin, banUser, unbanUser, getUserBans, type BanType } from '@/libs/AdminUtils';
import { getDb } from '@/libs/DB';
import { userBanSchema } from '@/models/Schema';

// GET: List all user bans or specific user bans
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const bans = await getUserBans(userId || undefined);

    return NextResponse.json(bans);
  } catch (error) {
    console.error('Error fetching user bans:', error);
    return NextResponse.json({ error: 'Failed to fetch user bans' }, { status: 500 });
  }
}

// POST: Create a new user ban
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, userName, userEmail, banReason, banType, expiresAt } = body;

    if (!userId || !userName) {
      return NextResponse.json(
        { error: 'userId and userName are required' },
        { status: 400 }
      );
    }

    const validBanTypes: BanType[] = ['full', 'reviews', 'suggestions', 'photos'];
    if (banType && !validBanTypes.includes(banType)) {
      return NextResponse.json(
        { error: 'Invalid banType. Must be one of: full, reviews, suggestions, photos' },
        { status: 400 }
      );
    }

    const expirationDate = expiresAt ? new Date(expiresAt) : undefined;

    const success = await banUser(
      userId,
      userName,
      userEmail || null,
      banReason || null,
      banType || 'full',
      expirationDate
    );

    if (!success) {
      return NextResponse.json({ error: 'Failed to ban user' }, { status: 500 });
    }

    return NextResponse.json({ message: 'User banned successfully' });
  } catch (error) {
    console.error('Error banning user:', error);
    return NextResponse.json({ error: 'Failed to ban user' }, { status: 500 });
  }
}

// DELETE: Remove/unban a user
export async function DELETE(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const banType = searchParams.get('banType') as BanType | null;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const success = await unbanUser(userId, banType || undefined);

    if (!success) {
      return NextResponse.json({ error: 'Failed to unban user' }, { status: 500 });
    }

    return NextResponse.json({ message: 'User unbanned successfully' });
  } catch (error) {
    console.error('Error unbanning user:', error);
    return NextResponse.json({ error: 'Failed to unban user' }, { status: 500 });
  }
}

// PUT: Update a specific ban
export async function PUT(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { banId, banReason, expiresAt, isActive } = body;

    if (!banId) {
      return NextResponse.json({ error: 'banId is required' }, { status: 400 });
    }

    const db = await getDb();
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (banReason !== undefined) updateData.banReason = banReason;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (isActive !== undefined) updateData.isActive = isActive;

    await db
      .update(userBanSchema)
      .set(updateData)
      .where(eq(userBanSchema.id, banId));

    return NextResponse.json({ message: 'Ban updated successfully' });
  } catch (error) {
    console.error('Error updating ban:', error);
    return NextResponse.json({ error: 'Failed to update ban' }, { status: 500 });
  }
}