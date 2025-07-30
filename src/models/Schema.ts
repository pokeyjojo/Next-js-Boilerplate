import { boolean, decimal, integer, pgTable, serial, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

// This file defines the structure of your database tables using the Drizzle ORM.

// To modify the database schema:
// 1. Update this file with your desired changes.
// 2. Generate a new migration by running: `npm run db:generate`

// The generated migration file will reflect your schema changes.
// The migration is automatically applied during the next database interaction,
// so there's no need to run it manually or restart the Next.js server.

export const counterSchema = pgTable('counter', {
  id: serial('id').primaryKey(),
  count: integer('count').default(0),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const tennisCourtSchema = pgTable('tennis_courts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  address: varchar('address', { length: 255 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 8 }).notNull(),
  longitude: decimal('longitude', { precision: 11, scale: 8 }).notNull(),
  numberOfCourts: integer('number_of_courts').notNull(),
  surfaceType: varchar('surface_type', { length: 50 }).notNull(),
  isIndoor: boolean('is_indoor').default(false),
  isLighted: boolean('is_lighted').default(false),
  isPublic: boolean('is_public').default(true),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const courtsSchema = pgTable('courts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  address: varchar('address', { length: 255 }).notNull(),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 50 }),
  zip: varchar('zip', { length: 20 }),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  lighted: boolean('lighted'),
  membershipRequired: boolean('membership_required'),
  courtType: varchar('court_type', { length: 50 }),
  hittingWall: boolean('hitting_wall'),
  courtCondition: varchar('court_condition', { length: 50 }),
  numberOfCourts: integer('number_of_courts'),
  surface: varchar('surface', { length: 50 }),
  parking: boolean('parking'),
});

export const reviewSchema = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  courtId: uuid('court_id').notNull(), // FK to tennis_courts.id (uuid)
  userId: varchar('user_id', { length: 255 }).notNull(),
  userName: varchar('user_name', { length: 255 }).notNull(),
  rating: integer('rating').notNull(), // 1-5
  text: varchar('text', { length: 2000 }),
  photos: varchar('photos', { length: 2000 }), // JSON array of photo URLs
  isDeleted: boolean('is_deleted').notNull().default(false), // true if admin deleted this review
  deletedBy: varchar('deleted_by', { length: 255 }), // admin user ID who deleted
  deletionReason: varchar('deletion_reason', { length: 500 }), // reason for deletion
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const courtPhotoSchema = pgTable('court_photos', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  courtId: uuid('court_id').notNull(), // FK to tennis_courts.id
  photoUrl: varchar('photo_url', { length: 500 }).notNull(),
  uploadedBy: varchar('uploaded_by', { length: 255 }).notNull(), // user ID who uploaded
  uploadedByUserName: varchar('uploaded_by_user_name', { length: 255 }).notNull(), // user name who uploaded
  caption: varchar('caption', { length: 500 }), // optional caption for the photo
  isDeleted: boolean('is_deleted').notNull().default(false), // true if admin deleted this photo
  deletedBy: varchar('deleted_by', { length: 255 }), // admin user ID who deleted
  deletionReason: varchar('deletion_reason', { length: 500 }), // reason for deletion
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const photoModerationSchema = pgTable('photo_moderation', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  photoUrl: varchar('photo_url', { length: 500 }).notNull(),
  reviewId: uuid('review_id').notNull(), // FK to reviews.id
  courtId: uuid('court_id').notNull(), // FK to tennis_courts.id
  uploadedBy: varchar('uploaded_by', { length: 255 }).notNull(), // user ID who uploaded
  isDeleted: boolean('is_deleted').notNull().default(false), // true if admin deleted this photo
  deletedBy: varchar('deleted_by', { length: 255 }), // admin user ID who deleted
  deletionReason: varchar('deletion_reason', { length: 500 }), // reason for deletion
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const reportSchema = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  reviewId: uuid('review_id').notNull(), // FK to reviews.id
  reportedBy: varchar('reported_by', { length: 255 }).notNull(), // user ID who reported
  reportedByUserName: varchar('reported_by_user_name', { length: 255 }).notNull(), // user name who reported
  reason: varchar('reason', { length: 500 }).notNull(), // reason for report
  status: varchar('status', { length: 50 }).notNull().default('pending'), // pending, resolved, dismissed
  resolvedBy: varchar('resolved_by', { length: 255 }), // admin user ID who resolved
  resolutionNote: varchar('resolution_note', { length: 500 }), // admin note on resolution
  resolvedAt: timestamp('resolved_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const courtPhotoReportSchema = pgTable('court_photo_reports', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  courtPhotoId: uuid('court_photo_id').notNull(), // FK to court_photos.id
  reportedBy: varchar('reported_by', { length: 255 }).notNull(), // user ID who reported
  reportedByUserName: varchar('reported_by_user_name', { length: 255 }).notNull(), // user name who reported
  reason: varchar('reason', { length: 500 }).notNull(), // reason for report
  status: varchar('status', { length: 50 }).notNull().default('pending'), // pending, resolved, dismissed
  resolvedBy: varchar('resolved_by', { length: 255 }), // admin user ID who resolved
  resolutionNote: varchar('resolution_note', { length: 500 }), // admin note on resolution
  resolvedAt: timestamp('resolved_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const courtEditSuggestionSchema = pgTable('court_edit_suggestions', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  courtId: uuid('court_id').notNull(), // FK to tennis_courts.id
  suggestedBy: varchar('suggested_by', { length: 255 }).notNull(), // user ID who suggested the edit
  suggestedByUserName: varchar('suggested_by_user_name', { length: 255 }).notNull(), // user name who suggested
  reason: varchar('reason', { length: 100 }), // reason for the suggestion
  status: varchar('status', { length: 50 }).notNull().default('pending'), // pending, approved, rejected
  reviewedBy: varchar('reviewed_by', { length: 255 }), // user ID who reviewed (must be different from suggestedBy)
  reviewedByUserName: varchar('reviewed_by_user_name', { length: 255 }), // user name who reviewed
  reviewNote: varchar('review_note', { length: 500 }), // note from reviewer
  reviewedAt: timestamp('reviewed_at', { mode: 'date' }),
  // Suggested changes
  suggestedName: varchar('suggested_name', { length: 255 }),
  suggestedAddress: varchar('suggested_address', { length: 255 }),
  suggestedCity: varchar('suggested_city', { length: 100 }),
  suggestedState: varchar('suggested_state', { length: 50 }),
  suggestedZip: varchar('suggested_zip', { length: 20 }),
  suggestedCourtType: varchar('suggested_court_type', { length: 50 }),
  suggestedNumberOfCourts: integer('suggested_number_of_courts'),
  suggestedSurface: varchar('suggested_surface', { length: 50 }),
  suggestedCondition: varchar('suggested_condition', { length: 50 }),
  suggestedType: varchar('suggested_type', { length: 50 }),
  suggestedHittingWall: boolean('suggested_hitting_wall'),
  suggestedLights: boolean('suggested_lights'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// NOTE: If you need to reset the reviews table to use UUIDs, run the following SQL in a migration or manually:
//
// DROP TABLE IF EXISTS "reviews";
// CREATE TABLE "reviews" (
//   id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
//   court_id uuid NOT NULL,
//   user_id varchar(255) NOT NULL,
//   user_name varchar(255) NOT NULL,
//   rating integer NOT NULL,
//   text varchar(2000),
//   created_at timestamp DEFAULT now() NOT NULL,
//   updated_at timestamp DEFAULT now() NOT NULL
// );
//
// Make sure your Drizzle/ORM schema matches this structure.
