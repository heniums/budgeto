import { fileURLToPath } from 'node:url';
import path from 'node:path';
import EmbeddedPostgres from 'embedded-postgres';
import { Pool, types } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import {
  TEST_PORT,
  TEST_DB,
  TEST_USER,
  TEST_PASSWORD,
  TEST_DATABASE_URL,
} from './constants';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(rootDir, '../../.pgdata-test');
const migrationsDir = path.resolve(rootDir, '../migrations');

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: TEST_USER,
  password: TEST_PASSWORD,
  port: TEST_PORT,
  persistent: false,
});

// Override pg's default numeric parser so Drizzle migrations that insert into
// the __drizzle_migrations table don't fail when reading back numeric values.
// Embedded Postgres returns numerics as strings, which Drizzle's migrator
// stores in a 'hash' column; we parse them to avoid type mismatch on read.
types.setTypeParser(1700, (val: string) => parseFloat(val));

export async function setup(): Promise<void> {
  await pg.initialise();
  await pg.start();
  await pg.createDatabase(TEST_DB);

  process.env.DATABASE_URL = TEST_DATABASE_URL;

  const pool = new Pool({ connectionString: TEST_DATABASE_URL, max: 1 });
  const db = drizzle(pool);

  // Run Drizzle migrations instead of hand-maintained raw SQL.
  // When the schema changes, regenerate migrations with:
  //   npx drizzle-kit generate
  // and the test setup picks them up automatically.
  await migrate(db, { migrationsFolder: migrationsDir });

  await pool.end();
}

export async function teardown(): Promise<void> {
  try {
    await pg.stop();
  } catch {
    // Best effort cleanup.
  }
}
