import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import CalendarPage from "@/(dashboard)/calendar/page";

describe("CalendarPage", () => {
  // TODO: Write tests when the page is ready to be tested
  it("should render without crashing", () => {
    render(<CalendarPage />);

    expect(screen.getByText("Oct 2025")).toBeTruthy();
  });
});
