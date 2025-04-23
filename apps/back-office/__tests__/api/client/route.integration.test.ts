/* eslint-disable max-lines-per-function */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { GET, POST, DELETE } from "../../../src/app/api/client/route";
import { prisma } from "@mcw/database";
import { generateUUID } from "@mcw/utils";
import { NextRequest } from "next/server";

// Define our own createRequest and createRequestWithBody functions
function createRequest(url: string): NextRequest {
  return new NextRequest(`http://localhost${url}`);
}

function createRequestWithBody(url: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost${url}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

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

// Define Client type for type safety
interface Client {
  id: string;
  legal_first_name: string;
  legal_last_name: string;
  preferred_name?: string;
  date_of_birth?: Date;
  is_waitlist: boolean;
  is_active: boolean;
}

describe("Client API - Integration Tests", () => {
  // Test data
  let clientId: string;
  let clinicianId: string;
  let locationId: string;
  let clientGroupId: string;

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

    // Create a location for the test
    const location = await prisma.location.create({
      data: {
        id: generateUUID(),
        name: "Test Location",
        address: "456 Test Avenue",
      },
    });
    locationId = location.id;

    // Create a client group for the test
    const clientGroup = await prisma.clientGroup.create({
      data: {
        id: generateUUID(),
        name: "Test Client Group",
        type: "INDIVIDUAL",
        clinician_id: clinicianId,
      },
    });
    clientGroupId = clientGroup.id;
  });

  // Clean up test data
  afterAll(async () => {
    // Delete the client created during tests
    if (clientId) {
      try {
        // Delete client contacts
        await prisma.clientContact.deleteMany({
          where: { client_id: clientId },
        });

        // Delete client reminder preferences
        await prisma.clientReminderPreference.deleteMany({
          where: { client_id: clientId },
        });

        // Delete client group memberships
        await prisma.clientGroupMembership.deleteMany({
          where: { client_id: clientId },
        });

        // Delete clinician client relationship if it exists
        await prisma.clinicianClient.deleteMany({
          where: { client_id: clientId },
        });

        // Delete the client
        await prisma.client.delete({
          where: { id: clientId },
        });
      } catch (error) {
        console.log("Error deleting client:", error);
      }
    }

    // Delete the client group
    if (clientGroupId) {
      try {
        await prisma.clientGroup.delete({
          where: { id: clientGroupId },
        });
      } catch (error) {
        console.log("Error deleting client group:", error);
      }
    }

    // Delete the clinician and associated user
    if (clinicianId) {
      try {
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
        console.log("Error deleting clinician or user:", error);
      }
    }

    // Delete the location
    if (locationId) {
      try {
        await prisma.location.delete({
          where: { id: locationId },
        });
      } catch (error) {
        console.log("Error deleting location:", error);
      }
    }
  });

  it("POST /api/client should create a new client", async () => {
    // Arrange
    const clientData = {
      client1: {
        legalFirstName: "John",
        legalLastName: "Doe",
        preferredName: "Johnny",
        dob: "1990-01-01",
        status: "active",
        primaryClinicianId: clinicianId,
        locationId: locationId,
        isResponsibleForBilling: true,
        emails: [
          { value: "john@example.com", type: "personal", permission: "allow" },
        ],
        phones: [
          { value: "123-456-7890", type: "mobile", permission: "allow" },
        ],
        notificationOptions: {
          upcomingAppointments: true,
          incompleteDocuments: true,
          cancellations: true,
        },
      },
      clientGroup: "individual",
    };

    // Act
    const req = createRequestWithBody("/api/client", clientData);
    const response = await POST(req);

    // Assert
    expect(response.status).toBe(201);
    const clients = await response.json();

    expect(Array.isArray(clients)).toBe(true);
    expect(clients.length).toBe(1);

    const client = clients[0];
    expect(client).toHaveProperty("id");
    expect(client.legal_first_name).toBe("John");
    expect(client.legal_last_name).toBe("Doe");
    expect(client.preferred_name).toBe("Johnny");
    expect(client.is_active).toBe(true);
    expect(client.is_waitlist).toBe(false);
    expect(client.ClientContact).toHaveLength(2); // 1 email + 1 phone
    expect(client.ClientReminderPreference).toHaveLength(3); // 3 notification types
    expect(client.ClientGroupMembership).toHaveLength(1);

    // Store the created client ID for cleanup
    clientId = client.id;

    // Create a ClinicianClient relationship so the client will appear in GET requests
    await prisma.clinicianClient.create({
      data: {
        clinician_id: clinicianId,
        client_id: clientId,
        assigned_date: new Date(),
        is_primary: true,
      },
    });
  });

  it("GET /api/client should return all clients", async () => {
    // Act
    const req = createRequest("/api/client");
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    const result = await response.json();

    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("pagination");
    expect(Array.isArray(result.data)).toBe(true);

    // Now the client should be returned since we've added the ClinicianClient relationship
    expect(result.data.length).toBeGreaterThan(0);

    // Find our client in the result data
    const foundClient = result.data.find((c: Client) => c.id === clientId);
    expect(foundClient).toBeDefined();
  });

  it("GET /api/client should filter by status", async () => {
    // Act
    const req = createRequest("/api/client?status=active");
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    const result = await response.json();

    expect(Array.isArray(result.data)).toBe(true);

    // All returned clients should be active
    result.data.forEach((client: Client) => {
      expect(client.is_active).toBe(true);
    });

    // Our client should be in the results since it's active
    expect(result.data.length).toBeGreaterThan(0);
    const foundClient = result.data.find((c: Client) => c.id === clientId);
    expect(foundClient).toBeDefined();
  });

  it("GET /api/client should search by name", async () => {
    // Act
    const req = createRequest("/api/client?search=john");
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    const result = await response.json();

    expect(Array.isArray(result.data)).toBe(true);

    // Our client should be in the results since its name contains "john"
    expect(result.data.length).toBeGreaterThan(0);
    const foundClient = result.data.find((c: Client) => c.id === clientId);
    expect(foundClient).toBeDefined();
  });

  it("GET /api/client?id=<id> should return a specific client", async () => {
    // Act
    const req = createRequest(`/api/client?id=${clientId}`);
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    const client = await response.json();

    expect(client.id).toBe(clientId);
    expect(client.legal_first_name).toBe("John");
    expect(client.legal_last_name).toBe("Doe");
    expect(client.preferred_name).toBe("Johnny");
    expect(client.ClientContact.length).toBeGreaterThan(0);
    expect(client.ClientGroupMembership.length).toBeGreaterThan(0);
  });

  it("GET /api/client?id=<id> should return 404 if client not found", async () => {
    // Generate a random UUID that doesn't exist
    const nonExistentId = generateUUID();

    // Act
    const req = createRequest(`/api/client?id=${nonExistentId}`);
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(404);
    const errorResponse = await response.json();
    expect(errorResponse).toHaveProperty("error", "Client not found");
  });

  it("DELETE /api/client should deactivate a client", async () => {
    // Act
    const req = createRequest(`/api/client?id=${clientId}`);
    const response = await DELETE(req);

    // Assert
    expect(response.status).toBe(200);
    const result = await response.json();

    expect(result).toHaveProperty("message", "Client deactivated successfully");
    expect(result).toHaveProperty("client");
    expect(result.client.id).toBe(clientId);
    expect(result.client.is_active).toBe(false);

    // Verify in the database
    const deactivatedClient = await prisma.client.findUnique({
      where: { id: clientId },
    });

    expect(deactivatedClient).not.toBeNull();
    expect(deactivatedClient?.is_active).toBe(false);
  });

  it("DELETE /api/client should return 400 if client ID is missing", async () => {
    // Act
    const req = createRequest("/api/client");
    const response = await DELETE(req);

    // Assert
    expect(response.status).toBe(400);
    const errorResponse = await response.json();
    expect(errorResponse).toHaveProperty("error", "Client ID is required");
  });

  it("DELETE /api/client should return 404 if client not found", async () => {
    // Generate a random UUID that doesn't exist
    const nonExistentId = generateUUID();

    // Act
    const req = createRequest(`/api/client?id=${nonExistentId}`);
    const response = await DELETE(req);

    // Assert
    expect(response.status).toBe(404);
    const errorResponse = await response.json();
    expect(errorResponse).toHaveProperty("error", "Client not found");
  });
});
