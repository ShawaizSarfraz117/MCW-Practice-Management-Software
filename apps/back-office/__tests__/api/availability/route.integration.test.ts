import { describe, it, expect, beforeEach, vi } from "vitest";
import { prisma } from "@mcw/database";
import { ClinicianPrismaFactory } from "@mcw/database/mock-data";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { GET, POST, PUT, DELETE } from "@/api/availability/route";
import { getServerSession } from "next-auth";

// Mock next-auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));
// Mock auth options
vi.mock("@/api/auth/[...nextauth]/auth-options", () => ({
  backofficeAuthOptions: {},
}));

describe("Availability API Integration Tests", () => {
  beforeEach(async () => {
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
    await prisma.availability.deleteMany({});
    await prisma.clinicianLocation.deleteMany({});
    await prisma.clinicianServices.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.clinician.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.clientGroup.deleteMany({});
    // Mock session for each test
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "test-user-id" },
    });
  });

  it("GET /api/availability should return all availabilities", async () => {
    const clinician = await ClinicianPrismaFactory.create();
    const avail1 = await prisma.availability.create({
      data: {
        clinician_id: clinician.id,
        title: "Morning Slot",
        allow_online_requests: false,
        location: "Room 1",
        start_date: new Date(),
        end_date: new Date(Date.now() + 3600000),
        is_recurring: false,
        recurring_rule: null,
      },
    });
    const avail2 = await prisma.availability.create({
      data: {
        clinician_id: clinician.id,
        title: "Afternoon Slot",
        allow_online_requests: true,
        location: "Room 2",
        start_date: new Date(Date.now() + 7200000),
        end_date: new Date(Date.now() + 10800000),
        is_recurring: false,
        recurring_rule: null,
      },
    });

    const req = createRequest("/api/availability");
    const response = await GET(req);
    expect(response.status).toBe(200);
    const json: import("@mcw/database").Availability[] = await response.json();
    expect(Array.isArray(json)).toBe(true);
    expect(json.length).toBe(2);
    expect(json.find((a) => a.id === avail1.id)).toBeDefined();
    expect(json.find((a) => a.id === avail2.id)).toBeDefined();
  });

  it("GET /api/availability/?id=<id> should return a specific availability", async () => {
    const clinician = await ClinicianPrismaFactory.create();
    const avail = await prisma.availability.create({
      data: {
        clinician_id: clinician.id,
        title: "Evening Slot",
        allow_online_requests: false,
        location: "Room 3",
        start_date: new Date(),
        end_date: new Date(Date.now() + 3600000),
        is_recurring: false,
        recurring_rule: null,
      },
    });
    const req = createRequest(`/api/availability/?id=${avail.id}`);
    const response = await GET(req);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toHaveProperty("id", avail.id);
    expect(json).toHaveProperty("title", avail.title);
    expect(json).toHaveProperty("location", avail.location);
  });

  it("POST /api/availability should create a new availability", async () => {
    const clinician = await ClinicianPrismaFactory.create();
    const availData = {
      clinician_id: clinician.id,
      title: "New Slot",
      allow_online_requests: true,
      location: "Room 4",
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 3600000).toISOString(),
      is_recurring: false,
      recurring_rule: null,
    };
    const req = createRequestWithBody("/api/availability", availData);
    const response = await POST(req);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toHaveProperty("id");
    expect(json).toHaveProperty("title", availData.title);
    expect(json).toHaveProperty("clinician_id", clinician.id);
  });

  it("PUT /api/availability should update an existing availability", async () => {
    const clinician = await ClinicianPrismaFactory.create();
    const avail = await prisma.availability.create({
      data: {
        clinician_id: clinician.id,
        title: "Old Slot",
        allow_online_requests: false,
        location: "Room 5",
        start_date: new Date(),
        end_date: new Date(Date.now() + 3600000),
        is_recurring: false,
        recurring_rule: null,
      },
    });
    const updateData = { title: "Updated Slot" };
    const req = createRequestWithBody(
      `/api/availability?id=${avail.id}`,
      updateData,
      { method: "PUT" },
    );
    const response = await PUT(req);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toHaveProperty("title", "Updated Slot");
  });

  it("DELETE /api/availability/?id=<id> should delete an availability", async () => {
    const clinician = await ClinicianPrismaFactory.create();
    const avail = await prisma.availability.create({
      data: {
        clinician_id: clinician.id,
        title: "Delete Slot",
        allow_online_requests: false,
        location: "Room 6",
        start_date: new Date(),
        end_date: new Date(Date.now() + 3600000),
        is_recurring: false,
        recurring_rule: null,
      },
    });
    const req = createRequest(`/api/availability/?id=${avail.id}`, {
      method: "DELETE",
    });
    const response = await DELETE(req);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toHaveProperty("success", true);
    // Confirm deletion
    const check = await prisma.availability.findUnique({
      where: { id: avail.id },
    });
    expect(check).toBeNull();
  });

  it("DELETE /api/availability/?id=<id> should return 400 for missing id", async () => {
    const req = createRequest(`/api/availability`, { method: "DELETE" });
    const response = await DELETE(req);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Availability ID is required");
  });
});
