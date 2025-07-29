CREATE TABLE "court_photo_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"photo_id" uuid NOT NULL,
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
CREATE TABLE "court_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"court_id" uuid NOT NULL,
	"photo_url" varchar(500) NOT NULL,
	"uploaded_by" varchar(255) NOT NULL,
	"uploaded_by_user_name" varchar(255) NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_by" varchar(255),
	"deletion_reason" varchar(500),
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
