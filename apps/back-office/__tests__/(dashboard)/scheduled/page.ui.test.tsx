import { describe, it, expect } from "vitest";

/**
 * UI tests for scheduled page
 * Tests imports and basic component loading
 * Marked as UI test because the component accesses DOM during import
 */
describe("Scheduled Page", () => {
  it("should import the page component without errors", async () => {
    const ScheduledPage = await import("@/(dashboard)/scheduled/page");

    expect(ScheduledPage).toBeDefined();
    expect(ScheduledPage.default).toBeDefined();
  });
});
