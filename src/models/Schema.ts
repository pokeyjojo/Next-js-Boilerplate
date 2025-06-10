import { boolean, decimal, integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';

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
  id: serial('id').primaryKey(),
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
