import { resolve } from 'node:path';
import { config } from 'dotenv';
import { getDb } from '../src/libs/DB';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function checkDatabaseSchema() {
  try {
    const db = await getDb();

    // Check tennis_courts table structure
    console.log('Checking tennis_courts table structure...');
    const result = await db.execute(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'tennis_courts' 
      ORDER BY ordinal_position;
    `);

    console.log('Tennis courts table columns:');
    result.forEach((row: any) => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Check if there are any tennis courts in the database
    console.log('\nChecking for tennis courts data...');
    const courts = await db.execute('SELECT id, name FROM tennis_courts LIMIT 5;');
    console.log(`Found ${courts.length} courts:`);
    courts.forEach((court: any) => {
      console.log(`  ID: ${court.id} (type: ${typeof court.id}), Name: ${court.name}`);
    });

    // Check photo_moderation table
    console.log('\nChecking photo_moderation table...');
    const photos = await db.execute('SELECT court_id FROM photo_moderation LIMIT 5;');
    console.log(`Found ${photos.length} photo records:`);
    photos.forEach((photo: any) => {
      console.log(`  Court ID: ${photo.court_id} (type: ${typeof photo.court_id})`);
    });
  } catch (error) {
    console.error('Error checking database schema:', error);
  }
}

checkDatabaseSchema();
