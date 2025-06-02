import { describe, it, expect } from "vitest";

/**
 * Unit tests for outstanding balances analytics page
 * Tests imports and basic component loading
 */
describe("Outstanding Balances Analytics Page", () => {
  it("should import the page component without errors", async () => {
    const OutstandingBalancesPage = await import(
      "@/(dashboard)/analytics/(reports)/outstanding-balances/page"
    );

    expect(OutstandingBalancesPage).toBeDefined();
    expect(OutstandingBalancesPage.default).toBeDefined();
  });
});
