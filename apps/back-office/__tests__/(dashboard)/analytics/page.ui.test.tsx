import { describe, it, expect } from "vitest";

/**
 * UI tests for analytics page
 * Tests imports and basic component loading
 * Marked as UI test because the component accesses DOM during import
 */
describe("Analytics Page", () => {
  it("should import the page component without errors", async () => {
    const AnalyticsPage = await import("@/(dashboard)/analytics/page");

    expect(AnalyticsPage).toBeDefined();
    expect(AnalyticsPage.default).toBeDefined();
  });
});
