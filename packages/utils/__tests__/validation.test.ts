import {
  emailSchema,
  passwordSchema,
  userSchema,
  validateEmail,
} from "@/validation";
import { describe, it, expect } from "vitest";

describe("Email Validation", () => {
  it("should validate correct email addresses", () => {
    const validEmails = [
      "test@example.com",
      "user.name@domain.com",
      "user+tag@example.co.uk",
    ];

    validEmails.forEach((email) => {
      expect(validateEmail(email)).toBe(true);
      expect(() => emailSchema.parse(email)).not.toThrow();
    });
  });

  it("should reject invalid email addresses", () => {
    const invalidEmails = [
      "notanemail",
      "@nodomain.com",
      "missing@.com",
      "spaces in@email.com",
      "",
    ];

    invalidEmails.forEach((email) => {
      expect(validateEmail(email)).toBe(false);
      expect(() => emailSchema.parse(email)).toThrow();
    });
  });
});

describe("Password Validation", () => {
  it("should validate passwords with correct length", () => {
    const validPasswords = [
      "password123",
      "12345678",
      "longpasswordwith100chars".repeat(4),
    ];

    validPasswords.forEach((password) => {
      expect(() => passwordSchema.parse(password)).not.toThrow();
    });
  });

  it("should reject passwords that are too short or too long", () => {
    const invalidPasswords = ["short", "1234567", "a".repeat(101)];

    invalidPasswords.forEach((password) => {
      expect(() => passwordSchema.parse(password)).toThrow();
    });
  });
});

describe("User Schema Validation", () => {
  it("should validate correct user objects", () => {
    const validUser = {
      email: "test@example.com",
      password: "password123",
      name: "John Doe",
    };

    expect(() => userSchema.parse(validUser)).not.toThrow();
  });

  it("should reject invalid user objects", () => {
    const invalidUsers = [
      {
        email: "invalid-email",
        password: "password123",
        name: "John Doe",
      },
      {
        email: "test@example.com",
        password: "short",
        name: "John Doe",
      },
      {
        email: "test@example.com",
        password: "password123",
        name: "J", // too short
      },
      {}, // missing all fields
    ];

    invalidUsers.forEach((user) => {
      expect(() => userSchema.parse(user)).toThrow();
    });
  });

  it("should reject objects with missing fields", () => {
    const incompleteUsers = [
      { email: "test@example.com", password: "password123" }, // missing name
      { email: "test@example.com", name: "John Doe" }, // missing password
      { password: "password123", name: "John Doe" }, // missing email
    ];

    incompleteUsers.forEach((user) => {
      expect(() => userSchema.parse(user)).toThrow();
    });
  });
});
