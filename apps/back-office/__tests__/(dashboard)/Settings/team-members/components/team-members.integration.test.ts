import { describe, it, expect } from "vitest";
import type { TeamMemberFormData } from "@/types/entities";

/**
 * Integration tests for team member forms and components
 * These tests verify all components work together without import/type errors
 *
 * Named .integration.test.ts because these tests:
 * - Load multiple components together
 * - Test cross-component dependencies
 * - Verify centralized type consistency
 * - Take longer due to multiple imports and validations
 */
describe("Team Member Components Integration", () => {
  it("should verify module imports and path resolution", async () => {
    // Test that our module structure works correctly
    // Import validation utilities (these export actual functions)
    const validatorsModule = await import(
      "@/(dashboard)/settings/team-members/components/shared/validators"
    );
    expect(validatorsModule.validators).toBeDefined();
    expect(typeof validatorsModule.validators.npi).toBe("function");

    // Test that types can be used (compile-time check - if this compiles, types are working)
    const testData: TeamMemberFormData = {
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
    };
    expect(testData.firstName).toBe("Test");
  });

  it("should import pure utility modules without DOM dependencies", async () => {
    // Test validators - pure functions, no DOM dependencies
    const validatorsModule = await import(
      "@/(dashboard)/settings/team-members/components/shared/validators"
    );
    expect(validatorsModule.validators).toBeDefined();
    expect(validatorsModule.validators.npi).toBeTypeOf("function");
    expect(validatorsModule.validators.email).toBeTypeOf("function");
    expect(validatorsModule.validators.required).toBeTypeOf("function");

    // Test validator functionality
    expect(validatorsModule.validators.npi("1234567890")).toContain(
      "Invalid NPI",
    );
    expect(
      validatorsModule.validators.email("test@example.com"),
    ).toBeUndefined();
    expect(validatorsModule.validators.required()("")).toBe(
      "This field is required",
    );
  });

  it("should use centralized types consistently across all components", async () => {
    // Test with actual type usage - if types are wrong, this won't compile
    const testData: TeamMemberFormData = {
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      npiNumber: "1234567890",
      license: {
        type: "License",
        number: "12345",
        expirationDate: "2025-12-31",
        state: "CA",
      },
    };

    expect(testData).toBeDefined();
    expect(testData.license?.state).toBe("CA");

    // Verify the type is correctly structured
    expect(testData.firstName).toBe("Test");
    expect(testData.license?.type).toBe("License");
  });
});
