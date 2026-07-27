CREATE INDEX IF NOT EXISTS "budget_category_category_id_idx" ON "budget_category" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "budget_user_id_idx" ON "budget" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "category_user_id_idx" ON "category" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transaction_wallet_id_idx" ON "transaction" USING btree ("wallet_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transaction_category_id_idx" ON "transaction" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wallet_user_id_idx" ON "wallet" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "category" DROP COLUMN IF EXISTS "type";
