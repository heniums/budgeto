import { fileURLToPath } from 'node:url';
import path from 'node:path';
import EmbeddedPostgres from 'embedded-postgres';
import { Pool } from 'pg';

const TEST_PORT = 5434;
const TEST_DB = 'budgeto_test';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(rootDir, '../../.pgdata-test');

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: 'postgres',
  password: 'postgres',
  port: TEST_PORT,
  persistent: false,
});

export async function setup(): Promise<void> {
  await pg.initialise();
  await pg.start();
  await pg.createDatabase(TEST_DB);

  const connectionString = `postgresql://postgres:postgres@localhost:${TEST_PORT}/${TEST_DB}`;
  process.env.DATABASE_URL = connectionString;

  const pool = new Pool({ connectionString, max: 1 });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "user" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "email" text NOT NULL UNIQUE,
      "password_hash" text NOT NULL,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now()
    )
  `);
  await pool.end();
}

export async function teardown(): Promise<void> {
  try {
    await pg.stop();
  } catch {
    // Best effort cleanup.
  }
}
