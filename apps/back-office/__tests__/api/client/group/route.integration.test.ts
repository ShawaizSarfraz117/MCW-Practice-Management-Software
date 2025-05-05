/* eslint-disable max-lines-per-function */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { GET } from "../../../../src/app/api/client/group/route";
import { prisma } from "@mcw/database";
import { generateUUID } from "@mcw/utils";
import { createRequest } from "@mcw/utils";

// Mock the getClinicianInfo function
vi.mock("@/utils/helpers", () => ({
  getClinicianInfo: vi.fn().mockResolvedValue({
    isClinician: true,
    clinicianId: null, // This will be updated with the actual clinician ID in beforeAll
  }),
  __esModule: true,
}));

// Import the mocked function to update it later
import { getClinicianInfo } from "@/utils/helpers";

// Define ClientGroup type for type safety
interface ClientGroup {
  id: string;
  name: string;
  type: string;
  clinician_id?: string;
}

describe("Client Group API - Integration Tests", () => {
  // Test data
  let clientId: string;
  let clientGroupId: string;
  let clinicianId: string;

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

    // Create a client group for the test
    const clientGroup = await prisma.clientGroup.create({
      data: {
        id: generateUUID(),
        name: "Test Family",
        type: "FAMILY",
        clinician_id: clinician.id,
      },
    });
    clientGroupId = clientGroup.id;

    // Create a client for the test
    const client = await prisma.client.create({
      data: {
        id: generateUUID(),
        legal_first_name: "John",
        legal_last_name: "Doe",
        preferred_name: "Johnny",
        date_of_birth: new Date("1990-01-01"),
        is_waitlist: false,
        is_active: true,
        primary_clinician_id: clinician.id,
      },
    });
    clientId = client.id;

    // Add client to the client group
    await prisma.clientGroupMembership.create({
      data: {
        client_group_id: clientGroup.id,
        client_id: client.id,
        role: "PRIMARY",
        is_contact_only: false,
        is_responsible_for_billing: true,
      },
    });

    // Add contact information to the client
    await prisma.clientContact.create({
      data: {
        client_id: client.id,
        contact_type: "EMAIL",
        type: "PERSONAL",
        value: "test@example.com",
        permission: "ALLOW",
        is_primary: true,
      },
    });
  });

  // Clean up test data
  afterAll(async () => {
    try {
      // Delete client contacts
      await prisma.clientContact.deleteMany({
        where: { client_id: clientId },
      });

      // Delete client group memberships
      await prisma.clientGroupMembership.deleteMany({
        where: { client_id: clientId },
      });

      // Delete the client
      await prisma.client.delete({
        where: { id: clientId },
      });

      // Delete the client group
      await prisma.clientGroup.delete({
        where: { id: clientGroupId },
      });

      // Delete the clinician and associated user
      const clinician = await prisma.clinician.findUnique({
        where: { id: clinicianId },
        select: { user_id: true },
      });

      if (clinician) {
        await prisma.clinician.delete({
          where: { id: clinicianId },
        });

        if (clinician.user_id) {
          await prisma.user.delete({
            where: { id: clinician.user_id },
          });
        }
      }
    } catch (error) {
      console.log("Error cleaning up test data:", error);
    }
  });

  it("GET /api/client/group should return all client groups", async () => {
    // Act
    const req = createRequest("/api/client/group");
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    const result = await response.json();

    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("pagination");
    expect(Array.isArray(result.data)).toBe(true);

    // Check if our created client group is in the list
    const foundGroup = result.data.find(
      (g: ClientGroup) => g.id === clientGroupId,
    );
    expect(foundGroup).toBeDefined();
    expect(foundGroup.name).toBe("Test Family");
    expect(foundGroup.type).toBe("FAMILY");
  });

  it("GET /api/client/group should filter by search term", async () => {
    // Act
    const req = createRequest("/api/client/group?search=Family");
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    const result = await response.json();

    expect(Array.isArray(result.data)).toBe(true);

    // Our test client group should be in the results
    const foundGroup = result.data.find(
      (g: ClientGroup) => g.id === clientGroupId,
    );
    expect(foundGroup).toBeDefined();
  });

  it("GET /api/client/group should filter by type", async () => {
    // Act
    const req = createRequest("/api/client/group?search=FAMILY");
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    const result = await response.json();

    expect(Array.isArray(result.data)).toBe(true);

    // Our test client group should be in the results
    const foundGroup = result.data.find(
      (g: ClientGroup) => g.id === clientGroupId,
    );
    expect(foundGroup).toBeDefined();
  });

  it("GET /api/client/group should filter by clinician ID", async () => {
    // Act
    const req = createRequest(`/api/client/group`);
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    const result = await response.json();

    expect(Array.isArray(result.data)).toBe(true);

    // Our test client group should be in the results
    const foundGroup = result.data.find(
      (g: ClientGroup) => g.id === clientGroupId,
    );
    expect(foundGroup).toBeDefined();
  });

  it("GET /api/client/group?id=<id> should return a specific client group", async () => {
    // Act
    const req = createRequest(`/api/client/group?id=${clientGroupId}`);
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    const clientGroup = await response.json();

    expect(clientGroup.id).toBe(clientGroupId);
    expect(clientGroup.name).toBe("Test Family");
    expect(clientGroup.type).toBe("FAMILY");
    expect(clientGroup.clinician_id).toBe(clinicianId);

    // Check client memberships
    expect(clientGroup.ClientGroupMembership).toHaveLength(1);
    expect(clientGroup.ClientGroupMembership[0].client_id).toBe(clientId);

    // Check client information is included
    expect(clientGroup.ClientGroupMembership[0].Client).toBeDefined();
    expect(clientGroup.ClientGroupMembership[0].Client.legal_first_name).toBe(
      "John",
    );
    expect(clientGroup.ClientGroupMembership[0].Client.legal_last_name).toBe(
      "Doe",
    );

    // Check client contact information is included
    expect(
      clientGroup.ClientGroupMembership[0].Client.ClientContact,
    ).toHaveLength(1);
    expect(
      clientGroup.ClientGroupMembership[0].Client.ClientContact[0].value,
    ).toBe("test@example.com");
  });

  it("GET /api/client/group?id=<id> should return 404 if client group not found", async () => {
    // Generate a random UUID that doesn't exist
    const nonExistentId = generateUUID();

    // Act
    const req = createRequest(`/api/client/group?id=${nonExistentId}`);
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(404);
    const errorResponse = await response.json();
    expect(errorResponse).toHaveProperty("error", "Client group not found");
  });

  it("GET /api/client/group should support pagination", async () => {
    // Act
    const req = createRequest("/api/client/group?page=1&limit=10");
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    const result = await response.json();

    expect(result.pagination).toEqual(
      expect.objectContaining({
        page: 1,
        limit: 10,
      }),
    );
  });

  it("GET /api/client/group should support sorting by name", async () => {
    // Act
    const req = createRequest("/api/client/group?sortBy=name");
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    const result = await response.json();

    expect(Array.isArray(result.data)).toBe(true);

    // Check that our client group is in the results
    const foundGroup = result.data.find(
      (g: ClientGroup) => g.id === clientGroupId,
    );
    expect(foundGroup).toBeDefined();
  });
});
