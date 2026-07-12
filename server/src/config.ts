import 'dotenv/config';

export interface Config {
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: number;
  port: number;
  nodeEnv: string;
}

let cached: Config | null = null;

/**
 * Resolves runtime configuration from environment variables. `DATABASE_URL`
 * defaults to the local embedded PostgreSQL instance so the app runs without a
 * `.env` file in development; set it explicitly for test/Neon environments.
 */
export function getConfig(): Config {
  if (cached) {
    return cached;
  }
  const databaseUrl =
    process.env.DATABASE_URL ??
    'postgresql://postgres:postgres@localhost:5433/budgeto';
  const jwtSecret =
    process.env.JWT_SECRET ?? 'dev-only-insecure-secret-change-me';
  const jwtExpiresIn = Number(process.env.JWT_EXPIRES_IN ?? '86400');
  const port = Number(process.env.PORT ?? '3000');
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  cached = { databaseUrl, jwtSecret, jwtExpiresIn, port, nodeEnv };
  return cached;
}
