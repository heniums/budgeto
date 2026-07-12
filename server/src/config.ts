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
 * Resolves runtime configuration from environment variables. Intentionally throws
 * when DATABASE_URL is missing so misconfiguration fails fast at startup.
 */
export function getConfig(): Config {
  if (cached) {
    return cached;
  }
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  const jwtSecret =
    process.env.JWT_SECRET ?? 'dev-only-insecure-secret-change-me';
  const jwtExpiresIn = Number(process.env.JWT_EXPIRES_IN ?? '86400');
  const port = Number(process.env.PORT ?? '3000');
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  cached = { databaseUrl, jwtSecret, jwtExpiresIn, port, nodeEnv };
  return cached;
}
