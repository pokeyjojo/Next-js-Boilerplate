-- Update photo_moderation table for deletion-based approach
ALTER TABLE "photo_moderation" DROP COLUMN IF EXISTS "status";
ALTER TABLE "photo_moderation" DROP COLUMN IF EXISTS "moderated_by";
ALTER TABLE "photo_moderation" DROP COLUMN IF EXISTS "moderation_reason";
ALTER TABLE "photo_moderation" DROP COLUMN IF EXISTS "moderated_at";

ALTER TABLE "photo_moderation" ADD COLUMN "is_deleted" boolean NOT NULL DEFAULT false;
ALTER TABLE "photo_moderation" ADD COLUMN "deleted_by" varchar(255);
ALTER TABLE "photo_moderation" ADD COLUMN "deletion_reason" varchar(500);
ALTER TABLE "photo_moderation" ADD COLUMN "deleted_at" timestamp; 