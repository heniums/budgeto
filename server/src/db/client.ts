import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { getConfig } from '../config';
import { users, wallets, transactions, categories, budgets } from './schema';

const pool = new Pool({ connectionString: getConfig().databaseUrl });
const db = drizzle(pool, { schema: { users, wallets, transactions, categories, budgets } });

export { pool, db };
