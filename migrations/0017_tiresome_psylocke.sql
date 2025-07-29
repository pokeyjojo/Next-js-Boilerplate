CREATE TABLE "court_edit_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"court_id" uuid NOT NULL,
	"suggested_by" varchar(255) NOT NULL,
	"suggested_by_user_name" varchar(255) NOT NULL,
	"reason" varchar(500),
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"reviewed_by" varchar(255),
	"reviewed_by_user_name" varchar(255),
	"review_note" varchar(500),
	"reviewed_at" timestamp,
	"suggested_name" varchar(255),
	"suggested_address" varchar(255),
	"suggested_city" varchar(100),
	"suggested_state" varchar(50),
	"suggested_zip" varchar(20),
	"suggested_court_type" varchar(50),
	"suggested_number_of_courts" integer,
	"suggested_surface" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "court_photos" DROP COLUMN "display_order";--> statement-breakpoint
ALTER TABLE "court_photos" DROP COLUMN "is_featured";