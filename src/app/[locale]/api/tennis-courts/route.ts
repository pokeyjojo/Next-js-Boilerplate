import { NextResponse } from 'next/server';
import postgres from 'postgres';
import { getDb } from '@/libs/DB';
import { tennisCourtSchema } from '@/models/Schema';

export async function GET() {
  try {
    console.error('API route hit: /api/tennis-courts');

    // Log environment variables (without sensitive data)
    console.error('DATABASE_URL exists:', !!process.env.DATABASE_URL);

    // Try direct connection first to verify database access
    const testClient = postgres('postgres://postgres:tennis@localhost:5432/tennis_courts');
    try {
      const testResult = await testClient`SELECT COUNT(*) FROM tennis_courts`;
      console.error('Direct connection test result:', testResult);
    } catch (directError) {
      console.error('Direct connection error:', directError);
    } finally {
      await testClient.end();
    }

    // Now try with the application's DB connection
    const db = await getDb();
    console.error('Database connection established');

    try {
      const courts = await db.select().from(tennisCourtSchema);
      console.error('Courts fetched:', courts.length);
      return NextResponse.json(courts);
    } catch (dbError) {
      console.error('Database query error:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error in /api/tennis-courts:', error);
    // Return more detailed error information
    return NextResponse.json({
      error: 'Failed to fetch tennis courts',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
