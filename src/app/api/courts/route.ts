import { NextResponse } from 'next/server';
import { getDb } from '@/libs/DB';
import { tennisCourtSchema } from '@/models/Schema';

export async function GET() {
  try {
    console.log('API route hit: /api/courts');
    const db = await getDb();
    console.log('Database connection established');
    const courts = await db.select().from(tennisCourtSchema);
    console.log('Courts fetched:', courts.length);
    return NextResponse.json(courts);
  } catch (error) {
    console.error('Error in /api/courts:', error);
    return NextResponse.json({ error: 'Failed to fetch tennis courts' }, { status: 500 });
  }
}
