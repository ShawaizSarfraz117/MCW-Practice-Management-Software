import { z } from "zod";

// Email validation schema
export const emailSchema = z.string().email();

// Password validation schema
export const passwordSchema = z.string().min(8).max(100);

// Example user schema
export const userSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(2).max(100),
});

// Validation utility function
export function validateEmail(email: string): boolean {
  try {
    emailSchema.parse(email);
    return true;
  } catch (error) {
    return false;
  }
}
