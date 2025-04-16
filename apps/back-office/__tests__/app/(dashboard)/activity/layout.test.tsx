import { render, screen } from "@testing-library/react";
import ActivityLayout from "@/app/(dashboard)/activity/layout";
import { describe, it, expect } from "vitest";

describe("ActivityLayout", () => {
  it("renders children correctly", () => {
    render(
      <ActivityLayout>
        <div data-testid="test-child">Test Content</div>
      </ActivityLayout>,
    );

    expect(screen.getByTestId("test-child")).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("applies correct styling classes", () => {
    render(
      <ActivityLayout>
        <div>Test Content</div>
      </ActivityLayout>,
    );

    const outerDiv =
      screen.getByText("Test Content").parentElement?.parentElement;
    expect(outerDiv).toHaveClass("flex-1", "overflow-hidden");

    const innerDiv = screen.getByText("Test Content").parentElement;
    expect(innerDiv).toHaveClass("h-full", "overflow-y-auto");
  });

  it("maintains layout structure with multiple children", () => {
    render(
      <ActivityLayout>
        <div data-testid="child-1">First Child</div>
        <div data-testid="child-2">Second Child</div>
      </ActivityLayout>,
    );

    expect(screen.getByTestId("child-1")).toBeInTheDocument();
    expect(screen.getByTestId("child-2")).toBeInTheDocument();

    const container = screen.getByTestId("child-1").parentElement;
    expect(container).toContainElement(screen.getByTestId("child-2"));
  });

  it("preserves nested component structure", () => {
    render(
      <ActivityLayout>
        <div data-testid="parent">
          <div data-testid="nested-child">Nested Content</div>
        </div>
      </ActivityLayout>,
    );

    const parent = screen.getByTestId("parent");
    const nestedChild = screen.getByTestId("nested-child");

    expect(parent).toContainElement(nestedChild);
    expect(nestedChild).toHaveTextContent("Nested Content");
  });
});
