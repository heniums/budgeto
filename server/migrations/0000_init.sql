-- Initial schema for the `user` table.
-- Creates the table used by the auth backend. The `name` column is
-- required by the "User Sign-Up, Sign-In & Profile Management" track so the
-- display name can be stored and returned alongside the email.

CREATE TABLE IF NOT EXISTS "user" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" text NOT NULL UNIQUE,
  "name" text NOT NULL DEFAULT '',
  "password_hash" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
