/* eslint-disable max-lines-per-function */
import { beforeEach, describe, expect, it, vi, Mock } from "vitest";
import { GET, POST, DELETE } from "../../../src/app/api/client/route";
import { NextRequest } from "next/server";

// Set up mock values
const MOCK_UUID = "mocked-uuid-123";
const MOCK_CLINICIAN_ID = "test-clinician-id";

// Mock uuid first, since it's used in the route.ts file
vi.mock("uuid", () => ({
  v4: () => MOCK_UUID,
  __esModule: true,
}));

// Then mock other dependencies
vi.mock("@mcw/utils", () => ({
  generateUUID: vi.fn().mockReturnValue(MOCK_UUID),
  __esModule: true,
}));

vi.mock("@mcw/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
  config: {
    setLevel: vi.fn(),
  },
  __esModule: true,
}));

// Mock the helpers module to return the clinician info correctly
vi.mock("@/utils/helpers", () => ({
  getClinicianInfo: vi.fn().mockImplementation(() => {
    return Promise.resolve({
      isClinician: true,
      clinicianId: MOCK_CLINICIAN_ID,
    });
  }),
  __esModule: true,
}));

// Import the helper to be able to spy on it
import { getClinicianInfo } from "@/utils/helpers";

// Mock the database operations
vi.mock("@mcw/database", () => {
  const clientFindUniqueMock = vi.fn();
  const clientFindManyMock = vi.fn();
  const clientCreateMock = vi.fn();
  const clientUpdateMock = vi.fn();
  const clientCountMock = vi.fn();
  const clientGroupCreateMock = vi.fn();
  const clientGroupMembershipCreateMock = vi.fn();
  const clientContactCreateManyMock = vi.fn();
  const clientReminderPreferenceFindManyMock = vi.fn();
  const clientReminderPreferenceCreateManyMock = vi.fn();

  // Create a mock transaction function that executes the callback with the prisma mock
  const transactionMock = vi.fn().mockImplementation(async (callback) => {
    const prismaMock = {
      client: {
        findUnique: clientFindUniqueMock,
        findMany: clientFindManyMock,
        create: clientCreateMock,
        update: clientUpdateMock,
        count: clientCountMock,
      },
      clientGroup: {
        create: clientGroupCreateMock,
      },
      clientGroupMembership: {
        create: clientGroupMembershipCreateMock,
      },
      clientContact: {
        createMany: clientContactCreateManyMock,
      },
      clientReminderPreference: {
        findMany: clientReminderPreferenceFindManyMock,
        createMany: clientReminderPreferenceCreateManyMock,
      },
    };

    return await callback(prismaMock);
  });

  return {
    prisma: {
      client: {
        findUnique: clientFindUniqueMock,
        findMany: clientFindManyMock,
        create: clientCreateMock,
        update: clientUpdateMock,
        count: clientCountMock,
      },
      clientGroup: {
        create: clientGroupCreateMock,
      },
      clientGroupMembership: {
        create: clientGroupMembershipCreateMock,
      },
      clientContact: {
        createMany: clientContactCreateManyMock,
      },
      clientReminderPreference: {
        findMany: clientReminderPreferenceFindManyMock,
        createMany: clientReminderPreferenceCreateManyMock,
      },
      $transaction: transactionMock,
    },
    __esModule: true,
  };
});

// Import mocked modules
import { prisma } from "@mcw/database";

// Create a mock client helper function
const mockClient = (overrides = {}) => {
  return {
    id: MOCK_UUID,
    legal_first_name: "John",
    legal_last_name: "Doe",
    preferred_name: "Johnny",
    date_of_birth: new Date("1990-01-01"),
    is_waitlist: false,
    is_active: true,
    primary_clinician_id: MOCK_CLINICIAN_ID,
    primary_location_id: "test-location-id",
    ClientContact: [],
    Clinician: null,
    Location: null,
    ClientGroupMembership: [],
    ...overrides,
  };
};

// Helper functions
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

describe("Client API", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Reset the getClinicianInfo mock for each test to ensure it's properly called
    (getClinicianInfo as ReturnType<typeof vi.fn>).mockImplementation(() => {
      return Promise.resolve({
        isClinician: true,
        clinicianId: MOCK_CLINICIAN_ID,
      });
    });
  });

  it("GET /api/client should return all clients", async () => {
    // Arrange
    const mockClients = [mockClient(), mockClient({ id: "client-2" })];
    (prisma.client.findMany as unknown as Mock).mockResolvedValue(mockClients);
    (prisma.client.count as unknown as Mock).mockResolvedValue(2);

    // Act
    const req = createRequest("/api/client");
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data).toHaveLength(2);
    expect(json.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 2,
    });
  });

  it("GET /api/client should filter by status", async () => {
    // Arrange
    const mockActiveClients = [mockClient()];
    (prisma.client.findMany as unknown as Mock).mockResolvedValue(
      mockActiveClients,
    );
    (prisma.client.count as unknown as Mock).mockResolvedValue(1);

    // Act
    const req = createRequest("/api/client?status=active");
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data).toHaveLength(1);
    expect(prisma.client.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([{ is_active: true }]),
        }),
      }),
    );
  });

  it("GET /api/client should search by name", async () => {
    // Arrange
    const mockSearchResults = [mockClient()];
    (prisma.client.findMany as unknown as Mock).mockResolvedValue(
      mockSearchResults,
    );
    (prisma.client.count as unknown as Mock).mockResolvedValue(1);

    // Act
    const req = createRequest("/api/client?search=john");
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data).toHaveLength(1);
    expect(prisma.client.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { legal_first_name: { contains: "john" } },
            { legal_last_name: { contains: "john" } },
          ]),
        }),
      }),
    );
  });

  it("GET /api/client?id=<id> should return a specific client", async () => {
    // Arrange
    const mockClientData = mockClient();
    (prisma.client.findUnique as unknown as Mock).mockResolvedValue(
      mockClientData,
    );

    // Act
    const req = createRequest(`/api/client?id=${MOCK_UUID}`);
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.id).toBe(MOCK_UUID);
    expect(json.legal_first_name).toBe("John");
    expect(json.legal_last_name).toBe("Doe");

    expect(prisma.client.findUnique).toHaveBeenCalledWith({
      where: { id: MOCK_UUID },
      include: {
        ClientContact: true,
        Clinician: true,
        Location: true,
        ClientGroupMembership: {
          include: {
            ClientGroup: true,
          },
        },
      },
    });
  });

  it("GET /api/client?id=<id> should return 404 if client not found", async () => {
    // Arrange
    (prisma.client.findUnique as unknown as Mock).mockResolvedValue(null);

    // Act
    const req = createRequest(`/api/client?id=${MOCK_UUID}`);
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Client not found");
  });

  it("POST /api/client should create a new client", async () => {
    // Arrange
    const mockCreatedClient = mockClient();
    const mockClientGroup = {
      id: MOCK_UUID,
      name: "John Doe",
      type: "individual",
    };
    const mockClientData = {
      client1: {
        legalFirstName: "John",
        legalLastName: "Doe",
        preferredName: "Johnny",
        dob: "1990-01-01",
        status: "active",
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

    (prisma.$transaction as unknown as Mock).mockImplementation(
      async (callback) => {
        // Mock clientGroup.create within transaction
        (prisma.clientGroup.create as unknown as Mock).mockResolvedValue(
          mockClientGroup,
        );

        // Mock client.create within transaction
        (prisma.client.create as unknown as Mock).mockResolvedValue(
          mockCreatedClient,
        );

        // Mock clientGroupMembership.create within transaction
        (
          prisma.clientGroupMembership.create as unknown as Mock
        ).mockResolvedValue({
          client_group_id: mockClientGroup.id,
          client_id: mockCreatedClient.id,
        });

        // Mock clientContact.createMany within transaction
        (prisma.clientContact.createMany as unknown as Mock).mockResolvedValue({
          count: 2,
        });

        // Mock clientReminderPreference.findMany within transaction
        (
          prisma.clientReminderPreference.findMany as unknown as Mock
        ).mockResolvedValue([]);

        // Mock clientReminderPreference.createMany within transaction
        (
          prisma.clientReminderPreference.createMany as unknown as Mock
        ).mockResolvedValue({ count: 3 });

        // Mock client.findUnique for the final result
        (prisma.client.findUnique as unknown as Mock).mockResolvedValue({
          ...mockCreatedClient,
          ClientContact: [
            { contact_type: "EMAIL", value: "john@example.com" },
            { contact_type: "PHONE", value: "123-456-7890" },
          ],
          ClientReminderPreference: [
            { reminder_type: "UPCOMING_APPOINTMENTS", is_enabled: true },
            { reminder_type: "INCOMPLETE_DOCUMENTS", is_enabled: true },
            { reminder_type: "CANCELLATIONS", is_enabled: true },
          ],
          ClientGroupMembership: [{ ClientGroup: mockClientGroup }],
        });

        // Execute the transaction callback and return the result
        return callback(prisma);
      },
    );

    // Act
    const req = createRequestWithBody("/api/client", mockClientData);
    const response = await POST(req);

    // Assert
    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json).toHaveLength(1);
    expect(json[0].id).toBe(MOCK_UUID);
    expect(json[0].legal_first_name).toBe("John");
    expect(json[0].legal_last_name).toBe("Doe");
    expect(json[0].ClientGroupMembership).toHaveLength(1);
    expect(json[0].ClientGroupMembership[0].ClientGroup.name).toBe("John Doe");
  });

  it("POST /api/client should return 400 if no client data provided", async () => {
    // Arrange
    const emptyData = {};

    // Act
    const req = createRequestWithBody("/api/client", emptyData);
    const response = await POST(req);

    // Assert
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toHaveProperty("error", "No client data provided");
  });

  it("DELETE /api/client should deactivate a client", async () => {
    // Arrange
    const mockClientData = mockClient();
    const mockDeactivatedClient = { ...mockClientData, is_active: false };

    (prisma.client.findUnique as unknown as Mock).mockResolvedValue(
      mockClientData,
    );
    (prisma.client.update as unknown as Mock).mockResolvedValue(
      mockDeactivatedClient,
    );

    // Act
    const req = createRequest(`/api/client?id=${MOCK_UUID}`);
    const response = await DELETE(req);

    // Assert
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.message).toBe("Client deactivated successfully");
    expect(json.client.is_active).toBe(false);

    expect(prisma.client.update).toHaveBeenCalledWith({
      where: { id: MOCK_UUID },
      data: { is_active: false },
    });
  });

  it("DELETE /api/client should return 400 if client ID is missing", async () => {
    // Act
    const req = createRequest("/api/client");
    const response = await DELETE(req);

    // Assert
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Client ID is required");
  });

  it("DELETE /api/client should return 404 if client not found", async () => {
    // Arrange
    (prisma.client.findUnique as unknown as Mock).mockResolvedValue(null);

    // Act
    const req = createRequest(`/api/client?id=${MOCK_UUID}`);
    const response = await DELETE(req);

    // Assert
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Client not found");
  });
});
