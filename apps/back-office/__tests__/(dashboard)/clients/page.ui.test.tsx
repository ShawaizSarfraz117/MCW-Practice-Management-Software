import { describe, it, expect } from "vitest";

/**
 * Unit tests for clients page
 * Tests imports and basic component loading
 */
describe("Clients Page", () => {
  it("should import the page component without errors", async () => {
    const ClientsPage = await import("@/(dashboard)/clients/page");

    expect(ClientsPage).toBeDefined();
    expect(ClientsPage.default).toBeDefined();
  });
});
