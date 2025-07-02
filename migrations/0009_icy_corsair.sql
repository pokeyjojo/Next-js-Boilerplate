--ALTER TABLE "reviews" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
--ALTER TABLE "reviews" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
--ALTER TABLE "reviews" ALTER COLUMN "court_id" SET DATA TYPE uuid;--> statement-breakpoint
--ALTER TABLE "tennis_courts" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
--ALTER TABLE "tennis_courts" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

DROP TABLE IF EXISTS "reviews";
CREATE TABLE "reviews" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  court_id uuid NOT NULL,
  user_id varchar(255) NOT NULL,
  user_name varchar(255) NOT NULL,
  rating integer NOT NULL,
  text varchar(2000),
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);