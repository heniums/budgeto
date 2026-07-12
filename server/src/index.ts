import { createApp } from './app';
import { getConfig } from './config';
import { pool } from './db/client';

const app = createApp();
const config = getConfig();

const server = app.listen(config.port, () => {
  console.log(`Budgeto server listening on http://localhost:${config.port}`);
});

async function shutdown(): Promise<void> {
  server.close();
  await pool.end();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
