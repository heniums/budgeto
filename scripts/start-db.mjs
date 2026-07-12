import EmbeddedPostgres from 'embedded-postgres';

const PORT = 5433;
const DB_NAME = 'budgeto';
const DATA_DIR = './.pgdata';

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
  console.log(
    `Embedded PostgreSQL running at postgresql://postgres:postgres@localhost:${PORT}/${DB_NAME}`,
  );
  // Keep the process alive so the database stays up for the dev servers.
  await new Promise<void>(() => {});
}

main();
