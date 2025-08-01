import { NextResponse } from 'next/server';
import postgres from 'postgres';

export async function GET() {
  try {
    const sql = postgres(process.env.DATABASE_URL || 'postgres://postgres:tennis@localhost:5432/tennis_courts');
    const courts = await sql`
      SELECT 
        c.id,
        c.name,
        c.address,
        c.city,
        c.state,
        c.zip,
        c.latitude,
        c.longitude,
        c.lighted,
        c.membership_required,
        c.court_type,
        c.hitting_wall,
        c.court_condition,
        c.number_of_courts,
        c.surface,
        c.parking,
        c.is_public,
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(r.id) as review_count
      FROM courts c
      LEFT JOIN reviews r ON c.id = r.court_id
      WHERE c.latitude IS NOT NULL AND c.longitude IS NOT NULL
      GROUP BY 
        c.id,
        c.name,
        c.address,
        c.city,
        c.state,
        c.zip,
        c.latitude,
        c.longitude,
        c.lighted,
        c.membership_required,
        c.court_type,
        c.hitting_wall,
        c.court_condition,
        c.number_of_courts,
        c.surface,
        c.parking,
        c.is_public
      ORDER BY c.name ASC
    `;

    const response = NextResponse.json(courts);

    // Add caching headers for better performance
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    response.headers.set('CDN-Cache-Control', 'public, max-age=300');
    response.headers.set('Vary', 'Accept-Encoding');

    return response;
  } catch (error) {
    console.error('Error in /api/courts:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch courts', details: message }, { status: 500 });
  }
}
