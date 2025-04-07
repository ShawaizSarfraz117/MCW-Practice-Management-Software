/* eslint-disable max-lines-per-function */
import { vi } from "vitest";
import { describe, it, expect, beforeEach } from "vitest";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { GET, POST, DELETE, PUT } from "@/api/client/route";
import prismaMock from "@mcw/database/mock";
import { ClinicianFactory } from "@mcw/database/mock-data";

describe("Client API Unit Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const mockClient = (overrides = {}) => ({
    id: "test-id",
    legal_first_name: "John",
    legal_last_name: "Doe",
    is_waitlist: false,
    primary_clinician_id: null,
    primary_location_id: null,
    created_at: new Date(),
    is_active: true,
    preferred_name: null,
    date_of_birth: null,
    referred_by: null,
    ...overrides,
  });

  it("GET /api/client should return all clients", async () => {
    const client1 = mockClient({ id: "1" });
    const client2 = mockClient({ id: "2" });
    const clients = [client1, client2];

    prismaMock.client.findMany.mockResolvedValueOnce(clients);

    const req = createRequest("/api/client");
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toHaveLength(clients.length);
    expect(json[0]).toHaveProperty("id", client1.id);
    expect(json[1]).toHaveProperty("id", client2.id);

    expect(prismaMock.client.findMany).toHaveBeenCalledWith({
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

  it("GET /api/client/?id=<id> should return 404 for non-existent client", async () => {
    prismaMock.client.findUnique.mockResolvedValueOnce(null);

    const req = createRequest("/api/client/?id=non-existent-id");
    const response = await GET(req);

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Client not found");
  });

  it("POST /api/client should create a new client with all related data", async () => {
    const clinician = ClinicianFactory.build();
    const createdClient = mockClient({
      legal_first_name: "John",
      legal_last_name: "Doe",
      preferred_name: "Johnny",
      is_active: true,
      is_waitlist: false,
      primary_clinician_id: clinician.id,
      ClientContact: [
        {
          id: "1",
          client_id: "1",
          contact_type: "EMAIL",
          type: "PRIMARY",
          value: "john@example.com",
          permission: "ALLOWED",
          is_primary: true,
        },
        {
          id: "2",
          client_id: "1",
          contact_type: "PHONE",
          type: "PRIMARY",
          value: "1234567890",
          permission: "ALLOWED",
          is_primary: true,
        },
      ],
      ClientReminderPreference: [
        {
          id: "1",
          client_id: "1",
          reminder_type: "UPCOMING_APPOINTMENTS",
          is_enabled: true,
        },
      ],
    });

    prismaMock.$transaction.mockImplementationOnce((callback) =>
      callback(prismaMock),
    );
    prismaMock.client.create.mockResolvedValueOnce(createdClient);
    prismaMock.client.findUnique.mockResolvedValueOnce(createdClient);

    const clientData = {
      client1: {
        legalFirstName: "John",
        legalLastName: "Doe",
        preferredName: "Johnny",
        status: "active",
        addToWaitlist: false,
        primaryClinicianId: clinician.id,
        clientGroupId: "{83C1C902-98E5-4A4C-8239-6F341F98DA1B}",
        emails: [
          { value: "john@example.com", type: "PRIMARY", permission: "ALLOWED" },
        ],
        phones: [
          { value: "1234567890", type: "PRIMARY", permission: "ALLOWED" },
        ],
        notificationOptions: {
          upcomingAppointments: true,
          incompleteDocuments: false,
          cancellations: false,
        },
      },
    };

    const req = createRequestWithBody("/api/client", clientData);
    const response = await POST(req);

    expect(response.status).toBe(201);
    const json = await response.json();

    expect(json[0]).toHaveProperty("legal_first_name", "John");
    expect(json[0]).toHaveProperty("legal_last_name", "Doe");
    expect(json[0]).toHaveProperty("preferred_name", "Johnny");
    expect(json[0]).toHaveProperty("is_active", true);
    expect(json[0]).toHaveProperty("primary_clinician_id", clinician.id);
    expect(json[0].ClientContact).toHaveLength(2);
  });

  it("PUT /api/client should update an existing client", async () => {
    const existingClient = mockClient();
    const updatedClient = mockClient({
      legal_first_name: "Jane",
      legal_last_name: "Smith",
    });

    prismaMock.client.findUnique.mockResolvedValueOnce(existingClient);
    prismaMock.$transaction.mockImplementationOnce((callback) =>
      callback(prismaMock),
    );
    prismaMock.client.update.mockResolvedValueOnce(updatedClient);
    prismaMock.client.findUnique.mockResolvedValueOnce(updatedClient);

    const updateData = {
      id: existingClient.id,
      legalFirstName: "Jane",
      legalLastName: "Smith",
      status: "active",
    };

    const req = createRequestWithBody("/api/client", updateData, {
      method: "PUT",
    });
    const response = await PUT(req);

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toHaveProperty("legal_first_name", "Jane");
    expect(json).toHaveProperty("legal_last_name", "Smith");

    expect(prismaMock.client.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: existingClient.id },
        data: expect.objectContaining({
          legal_first_name: "Jane",
          legal_last_name: "Smith",
        }),
      }),
    );
  });

  it("DELETE /api/client/?id=<id> should deactivate a client", async () => {
    const client = mockClient();
    const deactivatedClient = mockClient({ is_active: false });

    prismaMock.client.findUnique.mockResolvedValueOnce(client);
    prismaMock.client.update.mockResolvedValueOnce(deactivatedClient);

    const req = createRequest(`/api/client/?id=${client.id}`, {
      method: "DELETE",
    });
    const response = await DELETE(req);

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toHaveProperty("message", "Client deactivated successfully");
    expect(json.client).toHaveProperty("is_active", false);

    expect(prismaMock.client.update).toHaveBeenCalledWith({
      where: { id: client.id },
      data: { is_active: false },
    });
  });

  it("DELETE /api/client/?id=<id> should return 404 for non-existent client", async () => {
    prismaMock.client.findUnique.mockResolvedValueOnce(null);

    const req = createRequest("/api/client/?id=non-existent-id", {
      method: "DELETE",
    });
    const response = await DELETE(req);

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Client not found");
  });
});
