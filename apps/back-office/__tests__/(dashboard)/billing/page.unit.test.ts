import { describe, it, expect } from "vitest";

/**
 * Unit tests for billing page
 * Tests imports and basic component loading
 */
describe("Billing Page", () => {
  it("should import the page component without errors", async () => {
    const BillingPage = await import("@/(dashboard)/billing/page");

    expect(BillingPage).toBeDefined();
    expect(BillingPage.default).toBeDefined();
  });
});
