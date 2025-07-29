CREATE TABLE "courts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" varchar(255) NOT NULL,
	"city" varchar(100),
	"state" varchar(50),
	"zip" varchar(20),
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"lighted" boolean,
	"membership_required" boolean,
	"court_type" varchar(50),
	"hitting_wall" boolean,
	"court_condition" varchar(50),
	"number_of_courts" integer,
	"surface" varchar(50),
	"parking" boolean
);
--> statement-breakpoint
ALTER TABLE "court_photos" ADD COLUMN "display_order" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "court_photos" ADD COLUMN "is_featured" boolean DEFAULT false;