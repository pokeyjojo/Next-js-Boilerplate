import { NextResponse } from 'next/server';
import { getDb } from '@/libs/DB';

export async function GET() {
  try {
    const db = await getDb();
    // Fetch all courts from the 'courts' table with the correct columns
    const courts = await db.query(`
      SELECT 
        id,
        name,
        address,
        city,
        state,
        zip,
        latitude,
        longitude,
        lighted,
        membership_required,
        court_type,
        hitting_wall,
        court_condition,
        number_of_courts,
        surface,
        parking
      FROM courts
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    `);
    return NextResponse.json(courts);
  } catch (error) {
    console.error('Error in /api/courts:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch courts', details: message }, { status: 500 });
  }
}
