import { describe, it, expect } from "vitest";

/**
 * Unit tests for billing documents page
 * Tests imports and basic component loading
 */
describe("Billing Documents Page", () => {
  it("should import the page component without errors", async () => {
    const BillingDocumentsPage = await import(
      "@/(dashboard)/billing/documents/page"
    );

    expect(BillingDocumentsPage).toBeDefined();
    expect(BillingDocumentsPage.default).toBeDefined();
  });
});
