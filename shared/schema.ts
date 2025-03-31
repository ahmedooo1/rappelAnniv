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
  identifier: z.string(), // Added identifier field
  password: z.string() // Added password field
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

export const insertGroupSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  identifier: z.string().min(3, "L'identifiant doit faire au moins 3 caractères"),
  password: z.string().min(6, "Le mot de passe doit faire au moins 6 caractères"),
  description: z.string().optional()
});

export const insertBirthdaySchema = z.object({
  name: z.string(),
  birthdate: z.string(),
  groupId: z.number(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});