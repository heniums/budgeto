ALTER TABLE "transaction" ADD COLUMN "date" date DEFAULT now() NOT NULL;
UPDATE "transaction" SET "date" = "created_at"::date;