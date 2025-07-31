ALTER TABLE "court_edit_suggestions" ADD COLUMN "suggested_is_public" boolean;--> statement-breakpoint
ALTER TABLE "courts" ADD COLUMN "is_public" boolean DEFAULT true;