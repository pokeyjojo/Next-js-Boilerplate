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

export const reviewSchema = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  courtId: uuid('court_id').notNull(), // FK to tennis_courts.id (uuid)
  userId: varchar('user_id', { length: 255 }).notNull(),
  userName: varchar('user_name', { length: 255 }).notNull(),
  rating: integer('rating').notNull(), // 1-5
  text: varchar('text', { length: 2000 }),
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
