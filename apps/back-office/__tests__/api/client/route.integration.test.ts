import { describe, it, expect, beforeEach } from "vitest";
import type { Client } from "@mcw/database";
import { prisma } from "@mcw/database";
import {
  ClientGroupPrismaFactory,
  ClinicianPrismaFactory,
} from "@mcw/database/mock-data";
import { createRequest, createRequestWithBody } from "@mcw/utils";

import { DELETE, GET, POST, PUT } from "@/api/client/route";

describe("Client API Integration Tests", () => {
  beforeEach(async () => {
    await prisma.clientReminderPreference.deleteMany();
    await prisma.clientContact.deleteMany();
    await prisma.clientGroupMembership.deleteMany();
    await prisma.client.deleteMany();
    await prisma.clinician.deleteMany();
    await prisma.userRole.deleteMany();
    await prisma.user.deleteMany();
  });

  it("GET /api/client should return all clients", async () => {
    const clients = await Promise.all([
      prisma.client.create({
        data: {
          legal_first_name: "John",
          legal_last_name: "Doe",
          is_waitlist: false,
          is_active: true,
        },
      }),
      prisma.client.create({
        data: {
          legal_first_name: "Jane",
          legal_last_name: "Smith",
          is_waitlist: false,
          is_active: true,
        },
      }),
    ]);

    const req = createRequest("/api/client");
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toHaveLength(clients.length);

    clients.forEach((client: Client) => {
      const foundClient = json.find((c: Client) => c.id === client.id);
      expect(foundClient).toBeDefined();
      expect(foundClient).toHaveProperty("id", client.id);
      expect(foundClient).toHaveProperty(
        "legal_first_name",
        client.legal_first_name,
      );
      expect(foundClient).toHaveProperty(
        "legal_last_name",
        client.legal_last_name,
      );
      expect(foundClient).toHaveProperty("is_active", client.is_active);
    });
  });

  it("GET /api/client/?id=<id> should return a specific client", async () => {
    const client = await prisma.client.create({
      data: {
        legal_first_name: "John",
        legal_last_name: "Doe",
        is_waitlist: false,
        is_active: true,
      },
    });

    const req = createRequest(`/api/client/?id=${client.id}`);
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toHaveProperty("id", client.id);
    expect(json).toHaveProperty("legal_first_name", client.legal_first_name);
    expect(json).toHaveProperty("legal_last_name", client.legal_last_name);
    expect(json).toHaveProperty("is_active", client.is_active);
  });

  it("POST /api/client should create a new client with contacts and preferences", async () => {
    const clinician = await ClinicianPrismaFactory.create();
    const clientGroup = await ClientGroupPrismaFactory.create();

    const clientData = {
      client1: {
        legalFirstName: "John",
        legalLastName: "Doe",
        preferredName: "Johnny",
        dob: "1990-01-01",
        status: "active",
        addToWaitlist: false,
        primaryClinicianId: clinician.id,
        clientGroupId: clientGroup.id,
        isResponsibleForBilling: true,
        emails: [
          { value: "john@example.com", type: "PRIMARY", permission: "ALLOWED" },
        ],
        phones: [
          { value: "1234567890", type: "PRIMARY", permission: "ALLOWED" },
        ],
        notificationOptions: {
          upcomingAppointments: true,
          incompleteDocuments: true,
          cancellations: false,
        },
      },
    };

    const req = createRequestWithBody("/api/client", clientData);
    const response = await POST(req);

    expect(response.status).toBe(201);
    const json = await response.json();

    expect(json[0]).toHaveProperty(
      "legal_first_name",
      clientData.client1.legalFirstName,
    );
    expect(json[0]).toHaveProperty(
      "legal_last_name",
      clientData.client1.legalLastName,
    );
    expect(json[0]).toHaveProperty(
      "preferred_name",
      clientData.client1.preferredName,
    );
    expect(json[0]).toHaveProperty("is_active", true);
    expect(json[0]).toHaveProperty("is_waitlist", false);
    expect(json[0]).toHaveProperty("primary_clinician_id", clinician.id);

    // Check contacts were created
    expect(json[0].ClientContact).toHaveLength(2); // 1 email + 1 phone

    // Check reminder preferences were created
    expect(json[0].ClientReminderPreference).toHaveLength(3); // 3 types of notifications
  });

  it("PUT /api/client should update an existing client", async () => {
    const client = await prisma.client.create({
      data: {
        legal_first_name: "John",
        legal_last_name: "Doe",
        is_waitlist: false,
        is_active: true,
      },
    });
    const newClinician = await ClinicianPrismaFactory.create();

    const updateData = {
      id: client.id,
      legalFirstName: "Jane",
      legalLastName: "Smith",
      preferredName: "Janey",
      status: "active",
      primaryClinicianId: newClinician.id,
      emails: [
        { value: "jane@example.com", type: "PRIMARY", permission: "ALLOWED" },
      ],
      phones: [{ value: "9876543210", type: "PRIMARY", permission: "ALLOWED" }],
    };

    const req = createRequestWithBody("/api/client", updateData, {
      method: "PUT",
    });
    const response = await PUT(req);

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toHaveProperty("legal_first_name", updateData.legalFirstName);
    expect(json).toHaveProperty("legal_last_name", updateData.legalLastName);
    expect(json).toHaveProperty("preferred_name", updateData.preferredName);
    expect(json).toHaveProperty("is_active", true);
    expect(json).toHaveProperty("primary_clinician_id", newClinician.id);
  });

  it("DELETE /api/client/?id=<id> should deactivate a client", async () => {
    const client = await prisma.client.create({
      data: {
        legal_first_name: "John",
        legal_last_name: "Doe",
        is_waitlist: false,
        is_active: true,
      },
    });

    const req = createRequest(`/api/client/?id=${client.id}`, {
      method: "DELETE",
    });
    const response = await DELETE(req);

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toHaveProperty("message", "Client deactivated successfully");
    expect(json.client).toHaveProperty("id", client.id);
    expect(json.client).toHaveProperty("is_active", false);
  });
});
