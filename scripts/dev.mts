import { spawn } from 'node:child_process';

const LOCAL_DB_URL = 'postgresql://postgres:postgres@localhost:5433/budgeto';

const useLocalDb = process.argv.includes('--lcdb');

const env: NodeJS.ProcessEnv = { ...process.env };

if (useLocalDb) {
  // Force the local embedded-postgres connection string so a stale remote
  // DATABASE_URL in .env never leaks into the dev server.
  env.DATABASE_URL = LOCAL_DB_URL;
}

const commands = useLocalDb
  ? ['npm:db', 'npm:dev:server', 'npm:dev:client']
  : ['npm:dev:server', 'npm:dev:client'];

const names = useLocalDb ? 'db,server,client' : 'server,client';
const colors = useLocalDb ? 'blue,green,magenta' : 'green,magenta';

if (useLocalDb) {
  console.log('[dev] --lcdb: starting embedded PostgreSQL and forcing local DATABASE_URL');
} else {
  console.log('[dev] using DATABASE_URL from environment / .env');
}

const child = spawn(
  'npx',
  ['concurrently', '-n', names, '-c', colors, ...commands],
  {
    stdio: 'inherit',
    env,
    shell: true,
  },
);

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, () => {
    if (!child.killed) child.kill(sig);
  });
}
