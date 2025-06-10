import path from 'node:path';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

async function main() {
  try {
    console.error('Starting database migration...');

    const client = postgres('postgres://postgres:tennis@localhost:5432/tennis_courts');
    const db = drizzle(client);

    console.error('Running migrations...');
    await migrate(db, {
      migrationsFolder: path.join(process.cwd(), 'migrations'),
    });

    console.error('Migrations completed successfully!');
    await client.end();
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

main();
