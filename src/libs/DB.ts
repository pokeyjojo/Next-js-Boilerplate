import type { PgliteDatabase } from 'drizzle-orm/pglite';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import { migrate as migratePg } from 'drizzle-orm/postgres-js/migrator';
import { PHASE_PRODUCTION_BUILD } from 'next/dist/shared/lib/constants';
import postgres from 'postgres';
import * as schema from '@/models/Schema';

let drizzle: any = null;

export async function getDb() {
  if (drizzle) {
    return drizzle;
  }

  if (process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD) {
    const client = postgres('postgres://postgres:tennis@localhost:5432/tennis_courts');
    drizzle = drizzlePg(client, { schema });

    // Check if table exists before running migrations
    try {
      const tableExists = await client`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'tennis_courts'
        );
      `;

      if (tableExists && tableExists[0] && !tableExists[0].exists) {
        console.error('Running migrations...');
        await migratePg(drizzle, {
          migrationsFolder: path.join(process.cwd(), 'migrations'),
        });
      } else {
        console.error('Table already exists, skipping migrations');
      }
    } catch (error) {
      console.error('Error checking table existence:', error);
      throw error;
    }
  } else {
    // Stores the db connection in the global scope to prevent multiple instances due to hot reloading with Next.js
    const global = globalThis as unknown as { client: PGlite; drizzle: PgliteDatabase<typeof schema> };

    if (!global.client) {
      global.client = new PGlite();
      await global.client.waitReady;

      global.drizzle = drizzlePglite(global.client, { schema });
    }

    drizzle = global.drizzle;
    await migratePglite(global.drizzle, {
      migrationsFolder: path.join(process.cwd(), 'migrations'),
    });
  }

  return drizzle;
}
