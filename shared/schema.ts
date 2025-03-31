
import { z } from "zod";

export const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "GROUP_LEADER", "MEMBER"]),
  groupId: z.number().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const groupSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
});

export const birthdaySchema = z.object({
  name: z.string().min(2),
  birthdate: z.string(),
  message: z.string().optional(),
  groupId: z.number(),
});

export type User = {
  id: number;
  email: string;
  role: "ADMIN" | "GROUP_LEADER" | "MEMBER";
  groupId?: number;
};

export type Group = {
  id: number;
  name: string;
  description?: string;
};

export type Birthday = {
  id: number;
  name: string;
  birthdate: string;
  message?: string;
  groupId: number;
};
