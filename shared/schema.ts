import { z } from "zod";

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password: z.string(),
  role: z.enum(["ADMIN", "GROUP_LEADER", "MEMBER"]),
  groupId: z.number().optional(),
});

// Group schema 
export const groupSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
});

// Birthday schema
export const birthdaySchema = z.object({
  id: z.number(),
  name: z.string(),
  birthdate: z.string(),
  groupId: z.number(),
});

export type User = z.infer<typeof userSchema>;
export type Group = z.infer<typeof groupSchema>;
export type Birthday = z.infer<typeof birthdaySchema>;

export const insertBirthdaySchema = birthdaySchema.omit({ id: true });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});