import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import EmbeddedPostgres from 'embedded-postgres';

const PORT = 5433;
const DB_NAME = 'budgeto';
const DATA_DIR = './.pgdata';
const DATABASE_URL = `postgresql://postgres:postgres@localhost:${PORT}/${DB_NAME}`;

const pg = new EmbeddedPostgres({
  databaseDir: DATA_DIR,
  user: 'postgres',
  password: 'postgres',
  port: PORT,
  persistent: false,
});

async function main(): Promise<void> {
  try {
    await pg.initialise();
  } catch (error) {
    console.error('embedded-postgres initialise failed:', error);
    process.exit(1);
  }
  await pg.start();
  try {
    await pg.createDatabase(DB_NAME);
  } catch {
    // Database may already exist from a previous run.
  }

  const pool = new Pool({ connectionString: DATABASE_URL });
  try {
    const db = drizzle(pool);
    await migrate(db, { migrationsFolder: './server/migrations' });
    console.log('Applied database migrations.');
  } catch (error) {
    console.error('Migration failed:', error);
    await pool.end();
    process.exit(1);
  } finally {
    await pool.end();
  }

  console.log(
    `Embedded PostgreSQL running at postgresql://postgres:postgres@localhost:${PORT}/${DB_NAME}`,
  );
  // Keep the process alive so the database stays up for the dev servers.
  await new Promise<void>(() => {});
}

main();
