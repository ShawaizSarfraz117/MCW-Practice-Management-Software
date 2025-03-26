import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import CalendarPage from "./page";

describe("CalendarPage", () => {
  // TODO: Write tests when the page is ready to be tested
  it("should render without crashing", () => {
    render(<CalendarPage />);

    /// find the element
    // click on the element
    // assert the element is visible
    // assert the element is not visible
    // assert the element is disabled
    // assert the element is enabled
    // assert the element is focused
    // assert the element is not focused

    expect(screen.queryByText("Oct 2025")).toBeTruthy();
  });
});
