import { describe, it, expect } from "vitest";

/**
 * UI tests for activity page
 * Tests imports and basic component loading
 */
describe("Activity Page", () => {
  it("should import the page component without errors", async () => {
    const ActivityPage = await import("@/(dashboard)/activity/page");

    expect(ActivityPage).toBeDefined();
    expect(ActivityPage.default).toBeDefined();
  }, 60000);
});
