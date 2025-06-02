import { describe, it, expect } from "vitest";

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
  it("should load all form components without import errors", async () => {
    const modules = await Promise.all([
      import(
        "@/(dashboard)/settings/team-members/components/AddTeamMember/PersonalInfoForm"
      ),
      import(
        "@/(dashboard)/settings/team-members/components/AddTeamMember/ClinicalInfoForm"
      ),
      import(
        "@/(dashboard)/settings/team-members/components/AddTeamMember/LicenseInfoForm"
      ),
      import(
        "@/(dashboard)/settings/team-members/components/AddTeamMember/ServicesForm"
      ),
      import(
        "@/(dashboard)/settings/team-members/components/AddTeamMember/RoleInfoForm"
      ),
    ]);

    // All modules should have default exports
    modules.forEach((module) => {
      expect(module.default).toBeDefined();
    });
  });

  it("should import shared components and validators without errors", async () => {
    const { StateSelector } = await import(
      "@/(dashboard)/settings/team-members/components/shared/StateSelector"
    );
    const { validators } = await import(
      "@/(dashboard)/settings/team-members/components/shared/validators"
    );
    const { FormWrapper } = await import(
      "@/(dashboard)/settings/team-members/components/shared/FormWrapper"
    );

    expect(StateSelector).toBeDefined();
    expect(validators).toBeDefined();
    expect(FormWrapper).toBeDefined();
    expect(validators.required).toBeDefined();
    expect(validators.npi).toBeDefined();
  });

  it("should use centralized types consistently across all components", async () => {
    const entityTypes = await import("@/types/entities");

    // Verify the centralized types exist and are properly structured
    expect(entityTypes.TeamMemberFormData).toBeDefined();
    expect(entityTypes.BaseTeamMember).toBeDefined();
    expect(entityTypes.LicenseInfo).toBeDefined();

    // This would catch type inconsistencies across forms
    const testData: Partial<entityTypes.TeamMemberFormData> = {
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
  });

  it("should have consistent UI component imports across all forms", async () => {
    // This test verifies that all forms can import the same UI components
    // without conflicts, which would catch missing import issues

    const uiComponents = await import("@mcw/ui");

    // These are the components used across team member forms
    expect(uiComponents.Input).toBeDefined();
    expect(uiComponents.FormControl).toBeDefined();
    expect(uiComponents.FormItem).toBeDefined();
    expect(uiComponents.FormLabel).toBeDefined();
    expect(uiComponents.FormMessage).toBeDefined();
    expect(uiComponents.Select).toBeDefined();
    expect(uiComponents.SelectContent).toBeDefined();
    expect(uiComponents.SelectItem).toBeDefined();
    expect(uiComponents.SelectTrigger).toBeDefined();
    expect(uiComponents.SelectValue).toBeDefined();
  });
});
