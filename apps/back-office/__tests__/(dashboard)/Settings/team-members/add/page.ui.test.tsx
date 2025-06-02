import { describe, it, expect } from "vitest";

/**
 * Unit tests for add team member page
 * Tests imports and basic component loading
 */
describe("Add Team Member Page", () => {
  it("should import the page component without errors", async () => {
    const AddTeamMemberPage = await import(
      "@/(dashboard)/settings/team-members/add/page"
    );

    expect(AddTeamMemberPage).toBeDefined();
    expect(AddTeamMemberPage.default).toBeDefined();
  });
});
