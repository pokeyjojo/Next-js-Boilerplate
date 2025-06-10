CREATE TABLE "tennis_courts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" varchar(255) NOT NULL,
	"city" varchar(100) NOT NULL,
	"latitude" numeric(10, 8) NOT NULL,
	"longitude" numeric(11, 8) NOT NULL,
	"number_of_courts" integer NOT NULL,
	"surface_type" varchar(50) NOT NULL,
	"is_indoor" boolean DEFAULT false,
	"is_lighted" boolean DEFAULT false,
	"is_public" boolean DEFAULT true,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
