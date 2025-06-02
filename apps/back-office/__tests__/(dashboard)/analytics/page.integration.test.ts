import { describe, it, expect } from "vitest";

/**
 * Unit tests for analytics page
 * Tests imports and basic component loading
 */
describe("Analytics Page", () => {
  it("should import the page component without errors", async () => {
    const AnalyticsPage = await import("@/(dashboard)/analytics/page");

    expect(AnalyticsPage).toBeDefined();
    expect(AnalyticsPage.default).toBeDefined();
  }, 10000); // 10 second timeout for complex pages
});
