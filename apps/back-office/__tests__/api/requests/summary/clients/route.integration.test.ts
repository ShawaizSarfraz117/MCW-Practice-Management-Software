import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { GET } from "@/api/requests/summary/clients/route";
import { prisma } from "@mcw/database";
import { generateUUID } from "@mcw/utils";
import { NextRequest } from "next/server";
import { getClinicianInfo } from "@/utils/helpers";

// Define createRequest function
function createRequest(url: string): NextRequest {
  return new NextRequest(`http://localhost${url}`);
}

// Mock the getClinicianInfo function
vi.mock("@/utils/helpers", () => ({
  getClinicianInfo: vi.fn(),
  __esModule: true,
}));

// Helper function for cleaning up test data
async function cleanupTestData({
  clientIds,
  clinicianId,
  userId,
}: {
  clientIds?: string[];
  clinicianId?: string;
  userId?: string;
}) {
  // Delete clients and related data
  if (clientIds && clientIds.length > 0) {
    try {
      await prisma.clinicianClient.deleteMany({
        where: { client_id: { in: clientIds } },
      });
      await prisma.client.deleteMany({
        where: { id: { in: clientIds } },
      });
    } catch (error) {
      console.log("Error deleting clients:", error);
    }
  }

  // Delete the clinician
  if (clinicianId) {
    try {
      await prisma.clinician.delete({ where: { id: clinicianId } });
    } catch (error) {
      console.log("Error deleting clinician:", error);
    }
  }

  // Delete the user
  if (userId) {
    try {
      await prisma.user.delete({ where: { id: userId } });
    } catch (error) {
      console.log("Error deleting user:", error);
    }
  }
}

describe("Client Summary API - Integration Tests", () => {
  // Test data
  let clinicianId: string;
  let userId: string;
  const clientIds: string[] = [];

  // Setup test data
  beforeAll(async () => {
    // Create a user for the clinician
    const user = await prisma.user.create({
      data: {
        id: generateUUID(),
        email: `test-clinician-${Date.now()}@example.com`,
        password_hash: "hashed_password",
      },
    });
    userId = user.id;

    // Create a clinician for the test
    const clinician = await prisma.clinician.create({
      data: {
        id: generateUUID(),
        user_id: user.id,
        first_name: "Test",
        last_name: "Clinician",
        address: "123 Test Street",
        percentage_split: 70,
        is_active: true,
      },
    });
    clinicianId = clinician.id;

    // Update the mock to use the actual clinician ID
    (getClinicianInfo as ReturnType<typeof vi.fn>).mockResolvedValue({
      isClinician: true,
      clinicianId: clinician.id,
    });

    // Create test clients
    const prospectiveClient1 = await prisma.client.create({
      data: {
        id: generateUUID(),
        legal_first_name: "John",
        legal_last_name: "Doe",
        is_active: false,
        is_waitlist: false,
        primary_clinician_id: clinicianId,
      },
    });
    clientIds.push(prospectiveClient1.id);

    const prospectiveClient2 = await prisma.client.create({
      data: {
        id: generateUUID(),
        legal_first_name: "Jane",
        legal_last_name: "Smith",
        is_active: false,
        is_waitlist: false,
        primary_clinician_id: clinicianId,
      },
    });
    clientIds.push(prospectiveClient2.id);

    const activeClient1 = await prisma.client.create({
      data: {
        id: generateUUID(),
        legal_first_name: "Bob",
        legal_last_name: "Johnson",
        is_active: true,
        is_waitlist: false,
        primary_clinician_id: clinicianId,
      },
    });
    clientIds.push(activeClient1.id);

    const activeClient2 = await prisma.client.create({
      data: {
        id: generateUUID(),
        legal_first_name: "Alice",
        legal_last_name: "Brown",
        is_active: true,
        is_waitlist: false,
        primary_clinician_id: clinicianId,
      },
    });
    clientIds.push(activeClient2.id);

    const waitlistClient = await prisma.client.create({
      data: {
        id: generateUUID(),
        legal_first_name: "Charlie",
        legal_last_name: "Wilson",
        is_active: false,
        is_waitlist: true,
        primary_clinician_id: clinicianId,
      },
    });
    clientIds.push(waitlistClient.id);

    // Create clinician-client relationships
    for (const clientId of clientIds) {
      await prisma.clinicianClient.create({
        data: {
          clinician_id: clinicianId,
          client_id: clientId,
        },
      });
    }
  });

  // Clean up test data
  afterAll(async () => {
    await cleanupTestData({
      clientIds,
      clinicianId,
      userId,
    });
  });

  it("should return correct client summary counts", async () => {
    // Act
    const req = createRequest("/api/requests/summary/clients");
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    const json = await response.json();

    // We expect 2 prospective clients (is_active: false, is_waitlist: false)
    // and 2 active clients (is_active: true)
    // The waitlist client should not be counted in either category
    expect(json).toEqual({
      prospectiveClientsCount: 2,
      activeClientsCount: 2,
    });
  });

  it("should return zero counts when clinician has no clients", async () => {
    // Create a new clinician with no clients
    const newUser = await prisma.user.create({
      data: {
        id: generateUUID(),
        email: `test-clinician-no-clients-${Date.now()}@example.com`,
        password_hash: "hashed_password",
      },
    });

    const newClinician = await prisma.clinician.create({
      data: {
        id: generateUUID(),
        user_id: newUser.id,
        first_name: "Empty",
        last_name: "Clinician",
        address: "456 Empty Street",
        percentage_split: 70,
        is_active: true,
      },
    });

    // Update mock to use the new clinician
    (getClinicianInfo as ReturnType<typeof vi.fn>).mockResolvedValue({
      isClinician: true,
      clinicianId: newClinician.id,
    });

    try {
      // Act
      const req = createRequest("/api/requests/summary/clients");
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual({
        prospectiveClientsCount: 0,
        activeClientsCount: 0,
      });
    } finally {
      // Cleanup
      await prisma.clinician.delete({ where: { id: newClinician.id } });
      await prisma.user.delete({ where: { id: newUser.id } });

      // Restore original mock
      (getClinicianInfo as ReturnType<typeof vi.fn>).mockResolvedValue({
        isClinician: true,
        clinicianId: clinicianId,
      });
    }
  });

  it("should return 401 when clinician is not found", async () => {
    // Arrange
    (getClinicianInfo as ReturnType<typeof vi.fn>).mockResolvedValue({
      isClinician: false,
      clinicianId: null,
    });

    try {
      // Act
      const req = createRequest("/api/requests/summary/clients");
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({
        error: "Clinician not found",
      });
    } finally {
      // Restore original mock
      (getClinicianInfo as ReturnType<typeof vi.fn>).mockResolvedValue({
        isClinician: true,
        clinicianId: clinicianId,
      });
    }
  });
});
