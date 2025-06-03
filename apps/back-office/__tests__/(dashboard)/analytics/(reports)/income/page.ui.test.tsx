import { describe, it, expect } from "vitest";

/**
 * Unit tests for income analytics page
 * Tests imports and basic component loading
 */
describe("Income Analytics Page", () => {
  it("should import the page component without errors", async () => {
    const IncomePage = await import(
      "@/(dashboard)/analytics/(reports)/income/page"
    );

    expect(IncomePage).toBeDefined();
    expect(IncomePage.default).toBeDefined();
  }, 60000);
});
