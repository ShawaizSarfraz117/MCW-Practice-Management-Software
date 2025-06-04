import { describe, it, expect } from "vitest";

/**
 * UI tests for profile settings page
 * Tests imports and basic component loading
 */
describe("Profile Settings Page", () => {
  it("should import the page component without errors", async () => {
    const ProfilePage = await import(
      "@/(dashboard)/settings/profile-security/page"
    );

    expect(ProfilePage).toBeDefined();
    expect(ProfilePage.default).toBeDefined();
  }, 60000);
});
