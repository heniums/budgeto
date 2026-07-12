import type { Config } from 'drizzle-kit';

export default {
  schema: './server/src/db/schema.ts',
  out: './server/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      'postgresql://postgres:postgres@localhost:5433/budgeto',
  },
} satisfies Config;
