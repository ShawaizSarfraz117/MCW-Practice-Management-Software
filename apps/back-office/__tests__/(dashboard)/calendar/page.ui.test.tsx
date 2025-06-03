import { describe, it, expect } from "vitest";

/**
 * UI tests for calendar page
 * Tests imports and basic component loading
 */
describe("Calendar Page", () => {
  it("should import the page component without errors", async () => {
    const CalendarPage = await import("@/(dashboard)/calendar/page");

    expect(CalendarPage).toBeDefined();
    expect(CalendarPage.default).toBeDefined();
  }, 60000);
});
