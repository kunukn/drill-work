import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/* SQLite has no native datetime type. All timestamp columns
   (`createdAt`, `departureAt`, `arrivalAt`) are stored as ISO-8601 `text`
   and parsed at the edges (Zod schemas, `new Date(...)` in the UI). */

export const customers = sqliteTable("customers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  country: text("country").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const vessels = sqliteTable("vessels", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  capacityTeu: integer("capacity_teu").notNull(),
});

export const terminals = sqliteTable("terminals", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  unlocode: text("unlocode"),
});

export const sailings = sqliteTable("sailings", {
  id: text("id").primaryKey(),
  vesselId: text("vessel_id")
    .notNull()
    .references(() => vessels.id),
  fromTerminalId: text("from_terminal_id")
    .notNull()
    .references(() => terminals.id),
  toTerminalId: text("to_terminal_id")
    .notNull()
    .references(() => terminals.id),
  departureAt: text("departure_at").notNull(),
  arrivalAt: text("arrival_at").notNull(),
  capacityKgRemaining: integer("capacity_kg_remaining").notNull(),
  status: text("status", {
    enum: ["scheduled", "boarding", "departed", "arrived", "cancelled"],
  }).notNull(),
});

export const bookings = sqliteTable("bookings", {
  id: text("id").primaryKey(),
  customerId: text("customer_id")
    .notNull()
    .references(() => customers.id),
  vesselId: text("vessel_id")
    .notNull()
    .references(() => vessels.id),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  cargoType: text("cargo_type").notNull(),
  weightKg: integer("weight_kg").notNull(),
  status: text("status", {
    enum: ["pending", "confirmed", "in_transit", "delivered", "cancelled"],
  }).notNull(),
  departureAt: text("departure_at").notNull(),
  arrivalAt: text("arrival_at").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type Customer = typeof customers.$inferSelect;
export type Vessel = typeof vessels.$inferSelect;
export type Terminal = typeof terminals.$inferSelect;
export type Sailing = typeof sailings.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
