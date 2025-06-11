import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { GET } from "@/api/appointmentNote/route";
import {
  prisma,
  User,
  Client,
  Clinician,
  SurveyTemplate,
  Appointment,
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

const mockSession = {
  user: {
    id: "test-user-id",
    email: "test@example.com",
    role: "ADMIN",
  },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

describe("appointmentNote API - GET Integration Tests", () => {
  let _testUser: User;
  let testClient: Client;
  let testClinician: Clinician;
  let testTemplate: SurveyTemplate;
  let testAppointment: Appointment;

  beforeEach(async () => {
    vi.mocked(getBackOfficeSession).mockResolvedValue(mockSession as Session);

    // Create test user using factory
    _testUser = await prisma.user.create({
      data: UserFactory.build({
        email: "test@example.com",
        role: "ADMIN",
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
  });

  afterEach(async () => {
    // Use centralized cleanup utility
    await cleanupDatabase(prisma, { verbose: false });
  });

  it("should fetch note by appointment_id", async () => {
    // Create a survey answer using factory
    const surveyAnswer = await SurveyAnswersPrismaFactory.create({
      SurveyTemplate: {
        connect: { id: testTemplate.id },
      },
      Client: {
        connect: { id: testClient.id },
      },
      content: JSON.stringify({ question1: "I'm feeling good" }),
      status: "COMPLETED",
      Appointment: {
        connect: { id: testAppointment.id },
      },
    });

    const request = createRequest(
      `/api/appointmentNote?appointment_id=${testAppointment.id}`,
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.id).toBe(surveyAnswer.id);
    expect(data.appointment_id).toBe(testAppointment.id);
    expect(data.template.name).toBe("Progress Note Template");
    expect(data.client.legal_first_name).toBe("John");
  });

  it("should return 404 when note not found", async () => {
    const request = createRequest(
      "/api/appointmentNote?appointment_id=nonexistent-id",
    );
    const response = await GET(request);

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Note not found for this appointment");
  });

  it("should fetch all notes by client_id", async () => {
    // Create multiple survey answers using factory
    await SurveyAnswersPrismaFactory.create({
      SurveyTemplate: {
        connect: { id: testTemplate.id },
      },
      Client: {
        connect: { id: testClient.id },
      },
      content: JSON.stringify({ question1: "Answer 1" }),
      status: "COMPLETED",
    });

    await SurveyAnswersPrismaFactory.create({
      SurveyTemplate: {
        connect: { id: testTemplate.id },
      },
      Client: {
        connect: { id: testClient.id },
      },
      content: JSON.stringify({ question1: "Answer 2" }),
      status: "COMPLETED",
    });

    const request = createRequest(
      `/api/appointmentNote?client_id=${testClient.id}`,
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveLength(2);
    expect(data[0].client_id).toBe(testClient.id);
    expect(data[1].client_id).toBe(testClient.id);
  });

  it("should return 401 for unauthenticated requests", async () => {
    vi.mocked(getBackOfficeSession).mockResolvedValueOnce(null);

    const request = createRequest("/api/appointmentNote?client_id=any");
    const response = await GET(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("should validate query parameters", async () => {
    const request = createRequest("/api/appointmentNote");
    const response = await GET(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain(
      "appointment_id, id, template_id, or client_id is required",
    );
  });
});
