CREATE TABLE "photo_moderation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"photo_url" varchar(500) NOT NULL,
	"review_id" uuid NOT NULL,
	"court_id" uuid NOT NULL,
	"uploaded_by" varchar(255) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"moderated_by" varchar(255),
	"moderation_reason" varchar(500),
	"moderated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
