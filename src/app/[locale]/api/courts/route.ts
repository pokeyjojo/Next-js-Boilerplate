import { NextResponse } from 'next/server';
import postgres from 'postgres';

export async function GET() {
  try {
    // Create a new postgres client (use DATABASE_URL from env if available)
    const sql = postgres(process.env.DATABASE_URL || 'postgres://postgres:tennis@localhost:5432/tennis_courts');
    const courts = await sql`
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
    `;
    return NextResponse.json(courts);
  } catch (error) {
    console.error('Error in /api/courts:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch courts', details: message }, { status: 500 });
  }
}
