CREATE TABLE IF NOT EXISTS "user_widget" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"widget_id" text NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_widget_user_id_widget_id_idx" UNIQUE("user_id","widget_id")
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "settings" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_widget" ADD CONSTRAINT "user_widget_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "budget_category_category_id_idx" ON "budget_category" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "budget_user_id_idx" ON "budget" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "category_user_id_idx" ON "category" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transaction_wallet_id_idx" ON "transaction" USING btree ("wallet_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transaction_category_id_idx" ON "transaction" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wallet_user_id_idx" ON "wallet" USING btree ("user_id");