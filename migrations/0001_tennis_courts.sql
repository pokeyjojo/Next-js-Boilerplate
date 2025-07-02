CREATE TABLE IF NOT EXISTS "tennis_courts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(255) NOT NULL,
  "address" varchar(255) NOT NULL,
  "city" varchar(100) NOT NULL,
  "latitude" decimal(10,8) NOT NULL,
  "longitude" decimal(11,8) NOT NULL,
  "number_of_courts" integer NOT NULL,
  "surface_type" varchar(50) NOT NULL,
  "is_indoor" boolean NOT NULL DEFAULT false,
  "is_lighted" boolean NOT NULL DEFAULT false,
  "is_public" boolean NOT NULL DEFAULT true,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
); 