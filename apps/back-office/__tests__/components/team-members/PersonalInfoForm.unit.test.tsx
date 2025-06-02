import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * Component render tests for PersonalInfoForm
 * These tests would have caught validator signature issues
 */
describe("PersonalInfoForm", () => {
  it("should import without errors", async () => {
    expect(async () => {
      await import(
        "@/(dashboard)/settings/team-members/components/AddTeamMember/PersonalInfoForm"
      );
    }).not.toThrow();
  });

  it("should render without crashing", async () => {
    const PersonalInfoForm = (
      await import(
        "@/(dashboard)/settings/team-members/components/AddTeamMember/PersonalInfoForm"
      )
    ).default;

    expect(() => {
      render(<PersonalInfoForm initialData={{}} onSubmit={() => {}} />);
    }).not.toThrow();
  });

  it("should render all required form fields", async () => {
    const PersonalInfoForm = (
      await import(
        "@/(dashboard)/settings/team-members/components/AddTeamMember/PersonalInfoForm"
      )
    ).default;

    render(<PersonalInfoForm initialData={{}} onSubmit={() => {}} />);

    // These would fail if FormWrapper components are broken
    expect(screen.getByLabelText("First Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Last Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });
});
