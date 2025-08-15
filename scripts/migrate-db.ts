import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || '.env.local' });

async function main() {
  try {
    console.error('Starting database migration...');

    const databaseUrl = process.env.DATABASE_URL || '';
    const caPathEnv = process.env.DATABASE_CA_PATH;
    const resolvedCaPath = caPathEnv
      ? (path.isAbsolute(caPathEnv) ? caPathEnv : path.join(process.cwd(), caPathEnv))
      : undefined;
    const ca = resolvedCaPath && fs.existsSync(resolvedCaPath)
      ? fs.readFileSync(resolvedCaPath, 'utf8')
      : undefined;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set. Set it in .env.local or export it in the shell.');
    }
    if (caPathEnv && !ca) {
      throw new Error(`DATABASE_CA_PATH was provided but file was not found at: ${resolvedCaPath}`);
    }

    const client = postgres(databaseUrl, {
      ssl: ca ? { ca, rejectUnauthorized: true } : 'require',
    });
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
