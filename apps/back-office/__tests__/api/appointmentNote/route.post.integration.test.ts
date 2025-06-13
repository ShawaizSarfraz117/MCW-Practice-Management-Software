import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { POST } from "@/api/appointmentNote/route";
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

describe("appointmentNote API - POST Integration Tests", () => {
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

  it("should create a new note", async () => {
    const payload = {
      template_id: testTemplate.id,
      client_id: testClient.id,
      content: JSON.stringify({ question1: "My answer" }),
      status: "COMPLETED",
      appointment_id: testAppointment.id,
    };

    const request = createRequestWithBody("/api/appointmentNote", payload);
    const response = await POST(request);

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.template_id).toBe(testTemplate.id);
    expect(data.client_id).toBe(testClient.id);
    expect(data.appointment_id).toBe(testAppointment.id);
    expect(data.status).toBe("COMPLETED");

    // Verify in database
    const saved = await prisma.surveyAnswers.findFirst({
      where: { appointment_id: testAppointment.id },
    });
    expect(saved).toBeTruthy();
    expect(saved?.content).toBe(payload.content);
  });

  it("should prevent duplicate notes for same appointment and template", async () => {
    // Create first note using factory
    await SurveyAnswersPrismaFactory.create({
      SurveyTemplate: {
        connect: { id: testTemplate.id },
      },
      Client: {
        connect: { id: testClient.id },
      },
      content: JSON.stringify({ question1: "First answer" }),
      status: "COMPLETED",
      Appointment: {
        connect: { id: testAppointment.id },
      },
    });

    // Try to create duplicate
    const payload = {
      template_id: testTemplate.id,
      client_id: testClient.id,
      content: JSON.stringify({ question1: "Second answer" }),
      status: "COMPLETED",
      appointment_id: testAppointment.id,
    };

    const request = createRequestWithBody("/api/appointmentNote", payload);
    const response = await POST(request);

    expect(response.status).toBe(409);
    const data = await response.json();
    expect(data.error).toBe(
      "A note already exists for this appointment and template",
    );
  });

  it("should validate required fields", async () => {
    const invalidPayload = {
      template_id: "not-a-uuid",
      client_id: testClient.id,
      status: "COMPLETED",
    };

    const request = createRequestWithBody(
      "/api/appointmentNote",
      invalidPayload,
    );
    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid input");
    expect(data.details).toBeDefined();
  });

  it("should return 401 for unauthenticated requests", async () => {
    vi.mocked(getBackOfficeSession).mockResolvedValueOnce(null);

    const payload = {
      template_id: testTemplate.id,
      client_id: testClient.id,
      content: JSON.stringify({ question1: "Answer" }),
      status: "COMPLETED",
    };

    const request = createRequestWithBody("/api/appointmentNote", payload);
    const response = await POST(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("should set default status to DRAFT if not provided", async () => {
    const payload = {
      template_id: testTemplate.id,
      client_id: testClient.id,
      content: JSON.stringify({ question1: "Draft answer" }),
      status: "DRAFT", // API requires status field
    };

    const request = createRequestWithBody("/api/appointmentNote", payload);
    const response = await POST(request);

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.status).toBe("DRAFT");
  });
});
