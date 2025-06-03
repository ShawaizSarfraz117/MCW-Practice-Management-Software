import { describe, it, expect } from "vitest";

/**
 * Unit tests for practice info settings page
 * Tests imports and basic component loading
 */
describe("Practice Info Settings Page", () => {
  it("should import the page component without errors", async () => {
    const PracticeInfoPage = await import(
      "@/(dashboard)/settings/practice-info/page"
    );

    expect(PracticeInfoPage).toBeDefined();
    expect(PracticeInfoPage.default).toBeDefined();
  }, 60000);
});
