import { describe, it, expect } from "vitest";

/**
 * Unit tests for clinical info settings page
 * Tests imports and basic component loading
 */
describe("Clinical Info Settings Page", () => {
  it("should import the page component without errors", async () => {
    const ClinicalInfoPage = await import(
      "@/(dashboard)/settings/clinical-info/page"
    );

    expect(ClinicalInfoPage).toBeDefined();
    expect(ClinicalInfoPage.default).toBeDefined();
  }, 60000);
});
