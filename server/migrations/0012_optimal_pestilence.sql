DROP INDEX IF EXISTS "budget_category_category_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "budget_user_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "category_user_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "transaction_wallet_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "transaction_category_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "wallet_user_id_idx";--> statement-breakpoint
ALTER TABLE "transaction" ALTER COLUMN "date" SET DATA TYPE timestamp with time zone;