--ALTER TABLE "reviews" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint

--ALTER TABLE "reviews" ALTER COLUMN "id" SET DATA TYPE uuid USING id::uuid;
