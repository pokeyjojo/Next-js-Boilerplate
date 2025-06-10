import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/libs/DB';
import { logger } from '@/libs/Logger';
import { counterSchema } from '@/models/Schema';

const incrementSchema = z.object({
  increment: z.number(),
});

export async function POST(request: Request) {
  try {
    const parse = incrementSchema.safeParse(await request.json());
    if (!parse.success) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 },
      );
    }

    const id = Number((await headers()).get('x-e2e-random-id')) ?? 0;

    const db = await getDb();
    const count = await db
      .insert(counterSchema)
      .values({ id, count: parse.data.increment })
      .returning();

    logger.info('Counter incremented', {
      id,
      count: parse.data.increment,
    });

    return NextResponse.json(count[0]);
  } catch (error) {
    logger.error('Error incrementing counter:', error);
    return NextResponse.json(
      { error: 'Failed to increment counter' },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const db = await getDb();
    const result = await db.select().from(counterSchema);
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error fetching counter:', error);
    return NextResponse.json({ error: 'Failed to fetch counter' }, { status: 500 });
  }
}
