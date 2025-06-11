import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PUT } from "@/api/appointmentNote/route";
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
import { createRequestWithBody, generateUUID } from "@mcw/utils";
import { getBackOfficeSession } from "@/utils/helpers";
import type { Session } from "next-auth";

vi.mock("@/utils/helpers", () => ({
  getBackOfficeSession: vi.fn(),
}));

const mockSession = {
  user: {
    id: "test-user-id",
    email: "test@example.com",
    role: "ADMIN",
  },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

describe("appointmentNote API - PUT Integration Tests", () => {
  let _testUser: User;
  let testClient: Client;
  let testClinician: Clinician;
  let testTemplate: SurveyTemplate;
  let testAppointment: Appointment;
  let existingNote: SurveyAnswers;

  beforeEach(async () => {
    vi.mocked(getBackOfficeSession).mockResolvedValue(mockSession as Session);

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

    // Create existing note for update tests
    existingNote = await SurveyAnswersPrismaFactory.create({
      SurveyTemplate: {
        connect: { id: testTemplate.id },
      },
      Client: {
        connect: { id: testClient.id },
      },
      content: JSON.stringify({ question1: "Original answer" }),
      status: "DRAFT",
      Appointment: {
        connect: { id: testAppointment.id },
      },
    });
  });

  afterEach(async () => {
    // Use centralized cleanup utility
    await cleanupDatabase(prisma, { verbose: false });
  });

  it("should update existing note by appointment_id", async () => {
    const updatePayload = {
      id: testAppointment.id,
      content: JSON.stringify({ question1: "Updated answer" }),
      status: "COMPLETED",
    };

    const request = createRequestWithBody(
      "/api/appointmentNote",
      updatePayload,
      { method: "PUT" },
    );
    const response = await PUT(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.content).toBe(updatePayload.content);
    expect(data.status).toBe("COMPLETED");

    // Verify in database
    const updated = await prisma.surveyAnswers.findUnique({
      where: { id: existingNote.id },
    });
    expect(updated?.content).toBe(updatePayload.content);
    expect(updated?.status).toBe("COMPLETED");
  });

  it("should update existing note by id", async () => {
    const updatePayload = {
      id: existingNote.id,
      content: JSON.stringify({ question1: "Updated by ID" }),
    };

    const request = createRequestWithBody(
      "/api/appointmentNote",
      updatePayload,
      { method: "PUT" },
    );
    const response = await PUT(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.content).toBe(updatePayload.content);
  });

  it("should return 404 if note not found", async () => {
    const updatePayload = {
      id: "nonexistent-id",
      content: JSON.stringify({ question1: "Updated" }),
    };

    const request = createRequestWithBody(
      "/api/appointmentNote",
      updatePayload,
      { method: "PUT" },
    );
    const response = await PUT(request);

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Note not found");
  });

  it("should return 401 for unauthenticated requests", async () => {
    vi.mocked(getBackOfficeSession).mockResolvedValueOnce(null);

    const updatePayload = {
      id: existingNote.id,
      content: JSON.stringify({ question1: "Updated" }),
    };

    const request = createRequestWithBody(
      "/api/appointmentNote",
      updatePayload,
      { method: "PUT" },
    );
    const response = await PUT(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("should validate update payload", async () => {
    const invalidPayload = {
      // Missing id
      content: JSON.stringify({ question1: "Updated" }),
    };

    const request = createRequestWithBody(
      "/api/appointmentNote",
      invalidPayload,
      { method: "PUT" },
    );
    const response = await PUT(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid input");
  });
});
