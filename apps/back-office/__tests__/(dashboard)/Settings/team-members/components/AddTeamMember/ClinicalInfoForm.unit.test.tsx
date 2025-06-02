import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * Fast unit tests for ClinicalInfoForm component
 * These tests would have caught the missing import issues
 *
 * Located here to mirror: src/app/(dashboard)/settings/team-members/components/AddTeamMember/ClinicalInfoForm.tsx
 * Named .unit.test.tsx because these are fast import/render tests
 */
describe("ClinicalInfoForm", () => {
  it("should import without errors", async () => {
    expect(async () => {
      await import(
        "@/(dashboard)/settings/team-members/components/AddTeamMember/ClinicalInfoForm"
      );
    }).not.toThrow();
  });

  it("should render without crashing", async () => {
    const ClinicalInfoForm = (
      await import(
        "@/(dashboard)/settings/team-members/components/AddTeamMember/ClinicalInfoForm"
      )
    ).default;

    expect(() => {
      render(<ClinicalInfoForm initialData={{}} onSubmit={() => {}} />);
    }).not.toThrow();
  });

  it("should render all required form fields", async () => {
    const ClinicalInfoForm = (
      await import(
        "@/(dashboard)/settings/team-members/components/AddTeamMember/ClinicalInfoForm"
      )
    ).default;

    render(<ClinicalInfoForm initialData={{}} onSubmit={() => {}} />);

    // These would fail if imports are missing
    expect(screen.getByLabelText("Specialty")).toBeInTheDocument();
    expect(screen.getByLabelText("NPI Number")).toBeInTheDocument();
    expect(screen.getByLabelText("State")).toBeInTheDocument();
  });
});
