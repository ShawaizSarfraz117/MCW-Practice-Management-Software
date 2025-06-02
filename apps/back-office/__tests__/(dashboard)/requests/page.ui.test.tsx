import { describe, it, expect } from "vitest";

/**
 * Unit tests for requests page
 * Tests imports and basic component loading
 */
describe("Requests Page", () => {
  it("should import the page component without errors", async () => {
    const RequestsPage = await import("@/(dashboard)/requests/page");

    expect(RequestsPage).toBeDefined();
    expect(RequestsPage.default).toBeDefined();
  });
});
