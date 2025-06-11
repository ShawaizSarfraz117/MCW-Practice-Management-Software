import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { DELETE } from "@/api/appointmentNote/route";
import {
  prisma,
  Practice,
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
import { createRequest } from "@mcw/utils";
import { getBackOfficeSession } from "@/utils/helpers";
import type { Session } from "next-auth";

vi.mock("@/utils/helpers", () => ({
  getBackOfficeSession: vi.fn(),
}));

const mockSession = {
  user: {
    id: "test-user-id",
    email: "test@example.com",
    practice_id: "test-practice-id",
    role: "ADMIN",
  },
};

describe("appointmentNote API - DELETE Integration Tests", () => {
  let testPractice: Practice;
  let testUser: User;
  let testClient: Client;
  let testClinician: Clinician;
  let testTemplate: SurveyTemplate;
  let testAppointment: Appointment;
  let noteToDelete: SurveyAnswers;

  beforeEach(async () => {
    vi.mocked(getBackOfficeSession).mockResolvedValue(mockSession as Session);

    // Create test practice first (no factory available)
    testPractice = await prisma.practice.create({
      data: {
        name: "Test Practice",
        email: "practice@test.com",
        phone: "1234567890",
        city: "Test City",
        state: "TS",
        zip: "12345",
        address_line_1: "123 Test St",
      },
    });

    // Create test user using factory
    testUser = await prisma.user.create({
      data: {
        ...UserFactory.build({
          email: "test@example.com",
          role: "ADMIN",
        }),
        practice_id: testPractice.id,
      },
    });

    // Create test client using factory
    testClient = await prisma.client.create({
      data: {
        ...ClientFactory.build({
          email: "john.doe@example.com",
        }),
        practice_id: testPractice.id,
      },
    });

    // Create test clinician using factory
    testClinician = await ClinicianPrismaFactory.create({
      user_id: testUser.id,
      practice_id: testPractice.id,
    });

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
      practice_id: testPractice.id,
    });

    // Create test appointment using factory
    testAppointment = await AppointmentPrismaFactory.create({
      title: "Test Appointment",
      status: "SCHEDULED",
      appointment_type_id: "90834",
      clinician_id: testClinician.id,
      practice_id: testPractice.id,
    });

    // Create appointment-client relationship
    await prisma.appointmentClients.create({
      data: {
        appointment_id: testAppointment.id,
        client_id: testClient.id,
      },
    });

    // Create note to delete
    noteToDelete = await SurveyAnswersPrismaFactory.create({
      template_id: testTemplate.id,
      client_id: testClient.id,
      content: JSON.stringify({ question1: "To be deleted" }),
      status: "COMPLETED",
      appointment_id: testAppointment.id,
    });
  });

  afterEach(async () => {
    // Use centralized cleanup utility
    await cleanupDatabase(prisma, { verbose: false });
  });

  it("should delete note by id", async () => {
    const request = createRequest(
      `/api/appointmentNote?id=${noteToDelete.id}`,
      "DELETE",
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
      "DELETE",
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
    const request = createRequest(
      `/api/appointmentNote?id=nonexistent-id`,
      "DELETE",
    );
    const response = await DELETE(request);

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Note not found");
  });

  it("should return 401 for unauthenticated requests", async () => {
    vi.mocked(getBackOfficeSession).mockResolvedValueOnce(null);

    const request = createRequest(
      `/api/appointmentNote?id=${noteToDelete.id}`,
      "DELETE",
    );
    const response = await DELETE(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("should validate query parameters", async () => {
    const request = createRequest("/api/appointmentNote", "DELETE");
    const response = await DELETE(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("id or appointment_id is required");
  });

  it("should handle concurrent deletes gracefully", async () => {
    // First delete should succeed
    const request1 = createRequest(
      `/api/appointmentNote?id=${noteToDelete.id}`,
      "DELETE",
    );
    const response1 = await DELETE(request1);
    expect(response1.status).toBe(200);

    // Second delete should return 404
    const request2 = createRequest(
      `/api/appointmentNote?id=${noteToDelete.id}`,
      "DELETE",
    );
    const response2 = await DELETE(request2);
    expect(response2.status).toBe(404);
  });
});
