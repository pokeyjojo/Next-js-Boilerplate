CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"reported_by" varchar(255) NOT NULL,
	"reported_by_user_name" varchar(255) NOT NULL,
	"reason" varchar(500) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"resolved_by" varchar(255),
	"resolution_note" varchar(500),
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "deleted_by" varchar(255);--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "deletion_reason" varchar(500);--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "deleted_at" timestamp;