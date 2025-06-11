import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { DELETE } from "@/api/appointmentNote/route";
import {
  prisma,
  User,
  Client,
  Clinician,
  SurveyTemplate,
  Appointment,
  SurveyAnswers,
} from "@mcw/database";
import {
  UserFactory,
  ClientFactory,
  ClinicianPrismaFactory,
  SurveyTemplatePrismaFactory,
  AppointmentPrismaFactory,
  SurveyAnswersPrismaFactory,
} from "@mcw/database/mock-data";
import { cleanupDatabase } from "@mcw/database/test-utils";
import { createRequest, generateUUID } from "@mcw/utils";
import { getBackOfficeSession } from "@/utils/helpers";
import type { Session } from "next-auth";

vi.mock("@/utils/helpers", () => ({
  getBackOfficeSession: vi.fn(),
}));

describe("appointmentNote API - DELETE Integration Tests", () => {
  let _testUser: User;
  let testClient: Client;
  let testClinician: Clinician;
  let testTemplate: SurveyTemplate;
  let testAppointment: Appointment;
  let noteToDelete: SurveyAnswers;

  beforeEach(async () => {
    vi.mocked(getBackOfficeSession).mockResolvedValue({
      user: {
        id: "test-user-id",
        email: "test@example.com",
        role: "ADMIN",
      },
      expires: new Date(Date.now() + 86400000).toISOString(),
    } as Session);

    // Create test user using factory
    _testUser = await prisma.user.create({
      data: UserFactory.build({
        email: "test@example.com",
      }),
    });

    // Create test client
    testClient = await prisma.client.create({
      data: {
        ...ClientFactory.build(),
        legal_first_name: "John",
        legal_last_name: "Doe",
      },
    });

    // Create test clinician using factory
    testClinician = await ClinicianPrismaFactory.create();

    // Create test template using factory
    testTemplate = await SurveyTemplatePrismaFactory.create({
      name: "Progress Note Template",
      type: "PROGRESS_NOTES",
      content: JSON.stringify({
        pages: [
          {
            elements: [
              {
                type: "text",
                name: "question1",
                title: "How are you feeling today?",
              },
            ],
          },
        ],
      }),
      is_active: true,
    });

    // Create test appointment using factory
    testAppointment = await AppointmentPrismaFactory.create({
      title: "Test Appointment",
      status: "SCHEDULED",
      Clinician: {
        connect: { id: testClinician.id },
      },
    });

    // Create a client group and link appointment to it
    const clientGroup = await prisma.clientGroup.create({
      data: {
        id: generateUUID(),
        type: "individual",
        name: "Test Group",
        clinician_id: testClinician.id,
      },
    });

    // Add client to the group
    await prisma.clientGroupMembership.create({
      data: {
        client_group_id: clientGroup.id,
        client_id: testClient.id,
        role: "CLIENT",
      },
    });

    // Update appointment with client group
    testAppointment = await prisma.appointment.update({
      where: { id: testAppointment.id },
      data: { client_group_id: clientGroup.id },
    });

    // Create note to delete
    noteToDelete = await SurveyAnswersPrismaFactory.create({
      SurveyTemplate: {
        connect: { id: testTemplate.id },
      },
      Client: {
        connect: { id: testClient.id },
      },
      content: JSON.stringify({ question1: "To be deleted" }),
      status: "COMPLETED",
      Appointment: {
        connect: { id: testAppointment.id },
      },
    });
  });

  afterEach(async () => {
    // Use centralized cleanup utility
    await cleanupDatabase(prisma, { verbose: false });
  });

  it("should delete note by id", async () => {
    const request = createRequest(
      `/api/appointmentNote?id=${noteToDelete.id}`,
      { method: "DELETE" },
    );
    const response = await DELETE(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.message).toBe("Note deleted successfully");

    // Verify deletion
    const deleted = await prisma.surveyAnswers.findUnique({
      where: { id: noteToDelete.id },
    });
    expect(deleted).toBeNull();
  });

  it("should delete note by appointment_id", async () => {
    const request = createRequest(
      `/api/appointmentNote?appointment_id=${testAppointment.id}`,
      { method: "DELETE" },
    );
    const response = await DELETE(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.message).toBe("Note deleted successfully");

    // Verify deletion
    const deleted = await prisma.surveyAnswers.findFirst({
      where: { appointment_id: testAppointment.id },
    });
    expect(deleted).toBeNull();
  });

  it("should return 404 if note not found", async () => {
    const request = createRequest(`/api/appointmentNote?id=nonexistent-id`, {
      method: "DELETE",
    });
    const response = await DELETE(request);

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Note not found");
  });

  it("should return 401 for unauthenticated requests", async () => {
    vi.mocked(getBackOfficeSession).mockResolvedValueOnce(null);

    const request = createRequest(
      `/api/appointmentNote?id=${noteToDelete.id}`,
      { method: "DELETE" },
    );
    const response = await DELETE(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("should validate query parameters", async () => {
    const request = createRequest("/api/appointmentNote", { method: "DELETE" });
    const response = await DELETE(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("id or appointment_id is required");
  });

  it("should handle concurrent deletes gracefully", async () => {
    // First delete should succeed
    const request1 = createRequest(
      `/api/appointmentNote?id=${noteToDelete.id}`,
      { method: "DELETE" },
    );
    const response1 = await DELETE(request1);
    expect(response1.status).toBe(200);

    // Second delete should return 404
    const request2 = createRequest(
      `/api/appointmentNote?id=${noteToDelete.id}`,
      { method: "DELETE" },
    );
    const response2 = await DELETE(request2);
    expect(response2.status).toBe(404);
  });
});
