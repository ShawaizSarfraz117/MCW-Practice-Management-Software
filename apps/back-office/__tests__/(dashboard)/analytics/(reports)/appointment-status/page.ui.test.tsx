import { describe, it, expect } from "vitest";

/**
 * Unit tests for appointment status analytics page
 * Tests imports and basic component loading
 */
describe("Appointment Status Analytics Page", () => {
  it("should import the page component without errors", async () => {
    const AppointmentStatusPage = await import(
      "@/(dashboard)/analytics/(reports)/appointment-status/page"
    );

    expect(AppointmentStatusPage).toBeDefined();
    expect(AppointmentStatusPage.default).toBeDefined();
  });
});
