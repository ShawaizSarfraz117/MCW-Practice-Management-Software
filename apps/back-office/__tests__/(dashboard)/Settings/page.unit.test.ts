import { describe, it, expect } from "vitest";

/**
 * Unit tests for main settings page
 * Tests imports and basic component loading
 */
describe("Settings Page", () => {
  it("should import the page component without errors", async () => {
    const SettingsPage = await import("@/(dashboard)/settings/page");

    expect(SettingsPage).toBeDefined();
    expect(SettingsPage.default).toBeDefined();
  });
});
