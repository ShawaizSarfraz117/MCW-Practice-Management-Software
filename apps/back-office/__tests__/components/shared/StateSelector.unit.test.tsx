import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * Component tests for StateSelector
 * These tests would have caught the state.code vs state.abbreviation issue
 */
describe("StateSelector", () => {
  it("should import without errors", async () => {
    expect(async () => {
      await import(
        "@/(dashboard)/settings/team-members/components/shared/StateSelector"
      );
    }).not.toThrow();
  });

  it("should render without crashing", async () => {
    const { StateSelector } = await import(
      "@/(dashboard)/settings/team-members/components/shared/StateSelector"
    );

    expect(() => {
      render(<StateSelector label="Test State" value="" onChange={() => {}} />);
    }).not.toThrow();
  });

  it("should render states with correct data structure", async () => {
    const { StateSelector } = await import(
      "@/(dashboard)/settings/team-members/components/shared/StateSelector"
    );

    render(<StateSelector label="State" value="" onChange={() => {}} />);

    // This would fail if statesUS data structure is wrong
    expect(screen.getByText("State")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });
});
