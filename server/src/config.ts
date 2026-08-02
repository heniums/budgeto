import 'dotenv/config';

export interface Config {
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: number;
  refreshTokenExpiresIn: number;
  cookieSecure: boolean;
  corsOrigins: string[];
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
  const isTest = process.env.NODE_ENV === 'test';
  if (cached && !isTest) {
    return cached;
  }
  const databaseUrl =
    process.env.DATABASE_URL ??
    'postgresql://postgres:postgres@localhost:5433/budgeto';
  const jwtSecret =
    process.env.JWT_SECRET ?? 'dev-only-insecure-secret-change-me';
  const jwtExpiresIn = Number(process.env.JWT_EXPIRES_IN ?? '900');
  const refreshTokenExpiresIn = Number(
    process.env.REFRESH_TOKEN_EXPIRES_IN ?? '604800',
  );
  const port = Number(process.env.PORT ?? '3000');
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const cookieSecure =
    process.env.COOKIE_SECURE === 'true' || nodeEnv === 'production';
  const corsOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  cached = {
    databaseUrl,
    jwtSecret,
    jwtExpiresIn,
    refreshTokenExpiresIn,
    cookieSecure,
    corsOrigins,
    port,
    nodeEnv,
  };
  return cached;
}

/**
 * Resets the cached configuration. Used in tests to reload config after
 * environment variables change.
 */
export function resetConfig(): void {
  cached = null;
}
