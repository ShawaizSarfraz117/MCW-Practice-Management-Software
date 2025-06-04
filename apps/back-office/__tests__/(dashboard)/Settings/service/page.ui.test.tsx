import { describe, it, expect } from "vitest";

/**
 * Unit tests for service settings page
 * Tests imports and basic component loading
 */
describe("Service Settings Page", () => {
  it("should import the page component without errors", async () => {
    const ServiceSettingsPage = await import(
      "@/(dashboard)/settings/service/page"
    );

    expect(ServiceSettingsPage).toBeDefined();
    expect(ServiceSettingsPage.default).toBeDefined();
  }, 60000);
});
