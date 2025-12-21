import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
export * from "./models/auth";
import { users } from "./models/auth";

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  vin: text("vin"),
  licensePlate: text("license_plate"),
  currentMileage: integer("current_mileage").default(0),
  serviceIntervalMonths: integer("service_interval_months"),
  serviceIntervalKilometers: integer("service_interval_kilometers"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
  date: timestamp("date").notNull(),
  mileage: integer("mileage").notNull(),
  type: text("type").notNull(), // oil, brake, tire, etc.
  cost: integer("cost"), // in cents
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
  type: text("type").notNull(),
  dueDate: timestamp("due_date"),
  dueMileage: integer("due_mileage"),
  recurring: boolean("recurring").default(false),
  intervalMonths: integer("interval_months"),
  intervalMiles: integer("interval_miles"),
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  user: one(users, {
    fields: [vehicles.userId],
    references: [users.id],
  }),
  services: many(services),
  reminders: many(reminders),
}));

export const servicesRelations = relations(services, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [services.vehicleId],
    references: [vehicles.id],
  }),
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [reminders.vehicleId],
    references: [vehicles.id],
  }),
}));

// Schemas and Types
export const insertVehicleSchema = createInsertSchema(vehicles).omit({ id: true, createdAt: true, userId: true });
export const insertServiceSchema = createInsertSchema(services).omit({ id: true, createdAt: true });
export const insertReminderSchema = createInsertSchema(reminders).omit({ id: true, createdAt: true });

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = z.infer<typeof insertReminderSchema>;
