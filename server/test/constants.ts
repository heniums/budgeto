/**
 * Shared constants for the embedded PostgreSQL test instance. Imported by both
 * the Vitest globalSetup (which boots the database) and the per-worker setup
 * file (which points each test worker at the running instance).
 */
export const TEST_PORT = 5434;
export const TEST_DB = 'budgeto_test';
export const TEST_USER = 'postgres';
export const TEST_PASSWORD = 'postgres';
export const TEST_DATABASE_URL = `postgresql://${TEST_USER}:${TEST_PASSWORD}@localhost:${TEST_PORT}/${TEST_DB}`;
