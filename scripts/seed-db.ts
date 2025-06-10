import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from '@/libs/DB';
import { seedTennisCourts } from '@/models/seed';

async function main() {
  try {
    // Run migrations
    await migrate(db, { migrationsFolder: 'drizzle' });
    console.warn('Migrations completed successfully');

    // Seed the database
    await seedTennisCourts();
    console.warn('Database seeding completed successfully');

    process.exit(0);
  } catch (error) {
    console.error('Error during database setup:', error);
    process.exit(1);
  }
}

main();
