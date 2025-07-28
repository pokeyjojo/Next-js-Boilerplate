ALTER TABLE "photo_moderation" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "photo_moderation" ADD COLUMN "deleted_by" varchar(255);--> statement-breakpoint
ALTER TABLE "photo_moderation" ADD COLUMN "deletion_reason" varchar(500);--> statement-breakpoint
ALTER TABLE "photo_moderation" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "photo_moderation" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "photo_moderation" DROP COLUMN "moderated_by";--> statement-breakpoint
ALTER TABLE "photo_moderation" DROP COLUMN "moderation_reason";--> statement-breakpoint
ALTER TABLE "photo_moderation" DROP COLUMN "moderated_at";