--ALTER TABLE "reviews" ALTER COLUMN "court_id" SET DATA TYPE varchar(36);
ALTER TABLE "reviews" ALTER COLUMN "court_id" SET DATA TYPE uuid USING court_id::uuid;