import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";

/**
 * UI tests for team member components
 * Tests UI component imports and DOM-related functionality
 *
 * Named .ui.test.tsx because these tests:
 * - Require DOM environment (document, window objects)
 * - Test UI component rendering and interactions
 * - Use @testing-library/react for component testing
 */
describe("Team Member Components UI", () => {
  it("should import and render UI components from @mcw/ui", async () => {
    const { Input, FormLabel, Select } = await import("@mcw/ui");

    expect(Input).toBeDefined();
    expect(FormLabel).toBeDefined();
    expect(Select).toBeDefined();

    // Test that components can be rendered in DOM environment
    const TestComponent = () => (
      <div>
        <FormLabel>Test Label</FormLabel>
        <Input placeholder="Test input" />
      </div>
    );

    const { container } = render(<TestComponent />);
    expect(container).toBeDefined();
  });

  it("should load team member form components requiring DOM", async () => {
    // These components require DOM environment due to React Quill and other DOM dependencies
    // Test that they can be imported in a proper DOM environment
    const personalInfoModule = await import(
      "@/(dashboard)/settings/team-members/components/AddTeamMember/PersonalInfoForm"
    );
    expect(personalInfoModule.default).toBeDefined();

    const clinicalInfoModule = await import(
      "@/(dashboard)/settings/team-members/components/AddTeamMember/ClinicalInfoForm"
    );
    expect(clinicalInfoModule.default).toBeDefined();

    const licenseInfoModule = await import(
      "@/(dashboard)/settings/team-members/components/AddTeamMember/LicenseInfoForm"
    );
    expect(licenseInfoModule.default).toBeDefined();

    const servicesModule = await import(
      "@/(dashboard)/settings/team-members/components/AddTeamMember/ServicesForm"
    );
    expect(servicesModule.default).toBeDefined();

    const roleInfoModule = await import(
      "@/(dashboard)/settings/team-members/components/AddTeamMember/RoleInfoForm"
    );
    expect(roleInfoModule.default).toBeDefined();
  });

  it("should render StateSelector component correctly", async () => {
    const { StateSelector } = await import(
      "@/(dashboard)/settings/team-members/components/shared/StateSelector"
    );

    const { container } = render(
      <StateSelector
        label="Test State"
        value=""
        onChange={() => {}}
        errors={[]}
      />,
    );
    expect(container.querySelector("label")).toBeDefined();
  });
});
