ALTER TABLE "court_photo_reports" ADD COLUMN "court_photo_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "court_photos" ADD COLUMN "caption" varchar(500);--> statement-breakpoint
ALTER TABLE "court_photo_reports" DROP COLUMN "photo_id";