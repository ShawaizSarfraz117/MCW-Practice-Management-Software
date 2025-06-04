import { describe, it, expect } from "vitest";

/**
 * Unit tests for client detail page
 * Tests imports and basic component loading
 */
describe("Client Detail Page", () => {
  it("should import the page component without errors", async () => {
    const ClientDetailPage = await import("@/(dashboard)/clients/[id]/page");

    expect(ClientDetailPage).toBeDefined();
    expect(ClientDetailPage.default).toBeDefined();
  }, 60000);
});
