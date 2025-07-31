import type { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/libs/AdminUtils';
import { getDb } from '@/libs/DB';
import { newCourtSuggestionSchema } from '@/models/Schema';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const db = await getDb();
    let query = db.select().from(newCourtSuggestionSchema);

    if (status && status !== 'all') {
      query = query.where(eq(newCourtSuggestionSchema.status, status));
    }

    const suggestions = await query.orderBy(desc(newCourtSuggestionSchema.createdAt));

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Error fetching court suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch court suggestions' },
      { status: 500 },
    );
  }
}
