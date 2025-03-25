import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import CalendarPage from "./page";

describe("CalendarPage", () => {
  // TODO: Write tests when the page is ready to be tested
  it("should render without crashing", () => {
    render(<CalendarPage />);

    expect(screen.queryByText("Oct 2025")).toBeTruthy();
  });
});
