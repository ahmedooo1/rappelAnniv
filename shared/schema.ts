import { pgTable, text, serial, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const birthdays = pgTable("birthdays", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  birthdate: date("birthdate").notNull(),
  message: text("message").default(""),
});

export const insertBirthdaySchema = createInsertSchema(birthdays).pick({
  name: true,
  birthdate: true,
  message: true,
});

export type InsertBirthday = z.infer<typeof insertBirthdaySchema>;
export type Birthday = typeof birthdays.$inferSelect;

// Helper function to convert InsertBirthday to Birthday with an ID
export function toBirthday(insert: InsertBirthday, id: number): Birthday {
  return {
    id,
    name: insert.name,
    birthdate: insert.birthdate,
    message: insert.message ?? null
  };
}
