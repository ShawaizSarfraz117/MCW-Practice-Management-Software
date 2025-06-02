import { describe, it, expect } from "vitest";

/**
 * Fast unit tests for validators module
 * These tests verify all validator functions work correctly
 *
 * Located here to mirror: src/app/(dashboard)/settings/team-members/components/shared/validators.ts
 * Named .unit.test.ts because these are fast pure function tests
 */
describe("Validators", () => {
  it("should import validators without errors", async () => {
    const { validators } = await import(
      "@/(dashboard)/settings/team-members/components/shared/validators"
    );

    expect(validators).toBeDefined();
    expect(validators.required).toBeDefined();
    expect(validators.email).toBeDefined();
    expect(validators.npi).toBeDefined();
  });

  it("should validate required fields correctly", async () => {
    const { validators } = await import(
      "@/(dashboard)/settings/team-members/components/shared/validators"
    );

    const requiredValidator = validators.required("Field is required");

    expect(requiredValidator("")).toBe("Field is required");
    expect(requiredValidator(undefined)).toBe("Field is required");
    expect(requiredValidator("valid")).toBeUndefined();
  });

  it("should validate email correctly", async () => {
    const { validators } = await import(
      "@/(dashboard)/settings/team-members/components/shared/validators"
    );

    expect(validators.email("")).toBeUndefined();
    expect(validators.email("invalid")).toBe(
      "Please enter a valid email address",
    );
    expect(validators.email("test@example.com")).toBeUndefined();
  });

  it("should validate NPI correctly", async () => {
    const { validators } = await import(
      "@/(dashboard)/settings/team-members/components/shared/validators"
    );

    expect(validators.npi("")).toBeUndefined();
    expect(validators.npi("123")).toBe("NPI must be exactly 10 digits");
    expect(validators.npi("1234567890")).toBe("Invalid NPI number"); // Invalid Luhn
    // Note: Add valid NPI test if needed
  });
});
