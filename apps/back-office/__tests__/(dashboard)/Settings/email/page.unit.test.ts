import { describe, it, expect } from "vitest";

/**
 * Unit tests for email settings page
 * Tests imports and basic component loading
 */
describe("Email Settings Page", () => {
  it("should import the page component without errors", async () => {
    const EmailSettingsPage = await import("@/(dashboard)/settings/email/page");

    expect(EmailSettingsPage).toBeDefined();
    expect(EmailSettingsPage.default).toBeDefined();
  }, 10000); // 10 second timeout for complex pages
});
