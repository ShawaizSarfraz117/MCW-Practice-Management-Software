import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@mcw/database";
import { ClientGroupPrismaFactory } from "@mcw/database/mock-data";
import { GET } from "@/api/client/group/route";

// Define an interface for the API response structure
interface ClientGroupResponse {
  id: string;
  name: string;
  type: string;
  created_at: string;
  [key: string]: unknown;
}

describe("Client Group API Integration Tests", async () => {
  beforeEach(async () => {
    try {
      // Clean up data in correct order to respect foreign key constraints
      await prisma.payment.deleteMany({});
      await prisma.invoice.deleteMany({});
      await prisma.appointment.deleteMany({});
      await prisma.surveyAnswers.deleteMany({});
      await prisma.clientReminderPreference.deleteMany({});
      await prisma.clientContact.deleteMany({});
      await prisma.creditCard.deleteMany({});
      await prisma.clinicianClient.deleteMany({});
      await prisma.clientGroupMembership.deleteMany({});
      await prisma.client.deleteMany({});
      await prisma.clientGroup.deleteMany({});
    } catch (error) {
      console.error("Error cleaning up database:", error);
      // Continue with the test even if cleanup fails
    }
  });

  it("GET /api/client/group should return all client groups", async () => {
    // Create test client groups
    const createdGroups = await Promise.all([
      ClientGroupPrismaFactory.create({
        name: "Test Family Group",
        type: "FAMILY",
      }),
      ClientGroupPrismaFactory.create({
        name: "Test Organization Group",
        type: "ORGANIZATION",
      }),
    ]);

    // Call the API endpoint
    const response = await GET();

    // Verify response
    expect(response.status).toBe(200);
    const responseData = (await response.json()) as ClientGroupResponse[];

    expect(Array.isArray(responseData)).toBe(true);
    expect(responseData.length).toBeGreaterThanOrEqual(2);

    // Verify our created groups are in the response
    for (const createdGroup of createdGroups) {
      const foundGroup = responseData.find(
        (group) => group.id === createdGroup.id,
      );
      expect(foundGroup).toBeDefined();
      expect(foundGroup).toHaveProperty("name", createdGroup.name);
      expect(foundGroup).toHaveProperty("type", createdGroup.type);
    }
  });

  it("GET /api/client/group should return empty array when no groups exist", async () => {
    // Ensure no client groups exist
    await prisma.clientGroup.deleteMany({});

    // Call the API endpoint
    const response = await GET();

    // Verify response
    expect(response.status).toBe(200);
    const responseData = await response.json();

    expect(Array.isArray(responseData)).toBe(true);
    expect(responseData).toHaveLength(0);
  });
});
