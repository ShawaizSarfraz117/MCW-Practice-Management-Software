import { describe, it, expect } from "vitest";

/**
 * Unit tests for billing settings page
 * Tests imports and basic component loading
 */
describe("Billing Settings Page", () => {
  it("should import the page component without errors", async () => {
    const BillingSettingsPage = await import(
      "@/(dashboard)/settings/billing/page"
    );

    expect(BillingSettingsPage).toBeDefined();
    expect(BillingSettingsPage.default).toBeDefined();
  });
});
