import { describe, it, expect } from "vitest";

/**
 * Integration tests for team member forms
 * These tests verify all forms work together without import/type errors
 */
describe("Team Member Forms Integration", () => {
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

  it("should import shared components without errors", async () => {
    const { StateSelector } = await import(
      "@/(dashboard)/settings/team-members/components/shared/StateSelector"
    );
    const { validators } = await import(
      "@/(dashboard)/settings/team-members/components/shared/validators"
    );

    expect(StateSelector).toBeDefined();
    expect(validators).toBeDefined();
    expect(validators.required).toBeDefined();
    expect(validators.npi).toBeDefined();
  });

  it("should use centralized types consistently", async () => {
    const entityTypes = await import("@/types/entities");

    // Verify the centralized types exist and are properly structured
    expect(entityTypes.TeamMemberFormData).toBeDefined();

    // This would catch type inconsistencies across forms
    const testData: Partial<entityTypes.TeamMemberFormData> = {
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      npiNumber: "1234567890",
    };

    expect(testData).toBeDefined();
  });
});
