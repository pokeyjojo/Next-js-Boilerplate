import { NextResponse } from 'next/server';
import { getDb } from '@/libs/DB';
import { tennisCourtSchema } from '@/models/Schema';

export async function GET() {
  try {
    const db = await getDb();
    const courts = await db.select().from(tennisCourtSchema);
    return NextResponse.json(courts);
  } catch (error) {
    console.error('Error fetching tennis courts:', error);
    return NextResponse.json({ error: 'Failed to fetch tennis courts' }, { status: 500 });
  }
}
