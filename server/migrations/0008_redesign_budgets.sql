DROP TABLE IF EXISTS "budget" CASCADE;

CREATE TABLE IF NOT EXISTS "budget" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "icon" text NOT NULL DEFAULT 'wallet',
  "color" text NOT NULL DEFAULT '#1f8a4c',
  "period" text NOT NULL DEFAULT 'monthly',
  "start_date" date NOT NULL,
  "end_date" date NOT NULL,
  "total_amount" numeric(12, 2) NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "budget_category" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "budget_id" uuid NOT NULL REFERENCES "budget" ("id") ON DELETE CASCADE,
  "category_id" uuid NOT NULL REFERENCES "category" ("id") ON DELETE CASCADE,
  "limit_amount" numeric(12, 2) NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE ("budget_id", "category_id")
);
