/* eslint-disable max-lines-per-function */
import { vi, describe, it, expect, beforeEach } from "vitest";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { Prisma } from "@prisma/client";

// Mock the database module
vi.mock("@mcw/database", () => ({
  prisma: {
    surveyTemplate: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    client: {
      findUnique: vi.fn(),
    },
    appointment: {
      findUnique: vi.fn(),
    },
    surveyAnswers: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

// Mock helper functions
vi.mock("@/utils/helpers", () => ({
  getClinicianInfo: vi.fn(),
}));

// Import after mocks
import {
  GET,
  POST,
  DELETE,
} from "../../../src/app/api/mental-status-exam/route";
import { prisma } from "@mcw/database";
import { getClinicianInfo } from "@/utils/helpers";

// Mock data factories
const createMockTemplate = (overrides = {}) => ({
  id: "test-template-id",
  name: "Mental Status Exam",
  description: "Test mental status exam template",
  type: "MENTAL_STATUS_EXAM",
  content: JSON.stringify({
    appearance: "Normal",
    dress: "Appropriate",
    motor_activity: "Normal",
    insight: "Good",
    judgement: "Good",
    affect: "Appropriate",
    mood: "Euthymic",
    orientation: "X3: Oriented to person, place and time",
    memory: "Intact",
    attention: "Good",
    thought_content: "Normal",
    thought_process: "Normal",
    perception: "Normal",
    interview_behavior: "Appropriate",
    speech: "Normal",
    recommendations: "Continue current treatment plan",
  }),
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
  frequency_options: null,
  is_default: false,
  requires_signature: false,
  is_shareable: false,
  SurveyAnswers: [],
  ...overrides,
});

const createMockSurveyAnswer = (overrides = {}) => ({
  id: "test-answer-id",
  template_id: "test-template-id",
  client_id: "test-client-id",
  appointment_id: "test-appointment-id",
  content: null,
  status: "PENDING",
  assigned_at: new Date(),
  completed_at: null,
  is_signed: null,
  frequency: null,
  expiry_date: null,
  is_intake: false,
  is_locked: null,
  ...overrides,
});

const createMockClient = () => ({
  id: "test-client-id",
  legal_first_name: "John",
  legal_last_name: "Doe",
  date_of_birth: null,
  created_at: new Date(),
  is_active: true,
  is_waitlist: false,
  primary_clinician_id: null,
  preferred_first_name: null,
  phone_number: null,
  email_address: null,
  address_line_1: null,
  address_line_2: null,
  referred_by: null,
  primary_location_id: null,
  preferred_name: null,
  allow_online_appointment: false,
  access_billing_documents: false,
  use_secure_messaging: false,
});

const createMockAppointment = () => ({
  id: "test-appointment-id",
  type: "Mental Health",
  title: null,
  is_all_day: false,
  start_date: new Date(),
  end_date: new Date(),
  location_id: null,
  created_by: "test-clinician-id",
  status: "SCHEDULED",
  clinician_id: null,
  client_id: "test-client-id",
  created_at: new Date(),
  updated_at: new Date(),
  notes: null,
  duration: null,
  is_billable: true,
  rate: null,
  payment_received: null,
  write_off: null,
  appointment_fee: null,
  service_id: null,
  is_recurring: false,
  recurring_rule: null,
  is_no_show: false,
  is_cancelled: false,
  cancel_appointments: false,
  notify_cancellation: false,
  recurring_appointment_id: null,
  client_group_id: null,
  is_intake_form: false,
  is_telehealth: false,
  adjustable_amount: null,
  superbill_id: null,
});

const validMentalStatusContent = {
  appearance: "Normal",
  dress: "Appropriate",
  motor_activity: "Normal",
  insight: "Good",
  judgement: "Good",
  affect: "Appropriate",
  mood: "Euthymic",
  orientation: "X3: Oriented to person, place and time",
  memory: "Intact",
  attention: "Good",
  thought_content: "Normal",
  thought_process: "Normal",
  perception: "Normal",
  interview_behavior: "Appropriate",
  speech: "Normal",
  recommendations: "Continue current treatment plan",
};

const sampleSurveyContent = {
  appearance: "Well-groomed",
  dress: "Business casual",
  mood: "Stable",
};

describe("Mental Status Exam API Unit Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Reset default mock behavior
    vi.mocked(getClinicianInfo).mockResolvedValue({
      isClinician: true,
      clinicianId: "test-clinician-id",
      clinician: {
        id: "test-clinician-id",
        first_name: "Test",
        last_name: "Clinician",
      },
    });
  });

  describe("GET /api/mental-status-exam", () => {
    it("should return template when found by ID", async () => {
      const mockTemplate = createMockTemplate();
      vi.mocked(prisma.surveyTemplate.findUnique).mockResolvedValueOnce(
        mockTemplate,
      );

      const request = createRequest(
        "/api/mental-status-exam?id=test-template-id",
      );
      const response = await GET(request);

      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData.id).toBe("test-template-id");
      expect(responseData.name).toBe("Mental Status Exam");
      expect(responseData.content).toEqual(validMentalStatusContent);

      expect(prisma.surveyTemplate.findUnique).toHaveBeenCalledWith({
        where: {
          id: "test-template-id",
          type: "MENTAL_STATUS_EXAM",
        },
        include: {
          SurveyAnswers: true,
        },
      });
    });

    it("should return 404 when template not found", async () => {
      vi.mocked(prisma.surveyTemplate.findUnique).mockResolvedValueOnce(null);

      const request = createRequest(
        "/api/mental-status-exam?id=non-existent-id",
      );
      const response = await GET(request);

      expect(response.status).toBe(404);

      const responseData = await response.json();
      expect(responseData.error).toBe("Template not found");
    });

    it("should return 400 when ID parameter is missing", async () => {
      const request = createRequest("/api/mental-status-exam");
      const response = await GET(request);

      expect(response.status).toBe(400);

      const responseData = await response.json();
      expect(responseData.error).toBe("Template ID is required");
    });

    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(getClinicianInfo).mockResolvedValueOnce(null as never);

      const request = createRequest(
        "/api/mental-status-exam?id=test-template-id",
      );
      const response = await GET(request);

      expect(response.status).toBe(401);

      const responseData = await response.json();
      expect(responseData.error).toBe("Unauthorized");
    });
  });

  describe("POST /api/mental-status-exam (Create)", () => {
    it("should create template with valid data (template only)", async () => {
      const newTemplate = createMockTemplate();
      vi.mocked(prisma.surveyTemplate.create).mockResolvedValueOnce(
        newTemplate,
      );

      const requestBody = {
        name: "Mental Status Exam",
        description: "Test description",
        content: validMentalStatusContent,
      };

      const request = createRequestWithBody(
        "/api/mental-status-exam",
        requestBody,
      );
      const response = await POST(request);

      expect(response.status).toBe(201);

      const responseData = await response.json();
      expect(responseData.template.id).toBe("test-template-id");
      expect(responseData.template.name).toBe("Mental Status Exam");
      expect(responseData.template.content).toEqual(validMentalStatusContent);
      expect(responseData.message).toBe(
        "Mental Status Exam template created successfully",
      );
      expect(responseData.survey_answer).toBeUndefined();

      expect(prisma.surveyTemplate.create).toHaveBeenCalledWith({
        data: {
          name: "Mental Status Exam",
          description: "Test description",
          type: "MENTAL_STATUS_EXAM",
          content: JSON.stringify(validMentalStatusContent),
          is_active: true,
          updated_at: expect.any(Date),
        },
      });
    });

    it("should create template and survey answer when client_id and appointment_id provided", async () => {
      const newTemplate = createMockTemplate();
      const newAnswer = createMockSurveyAnswer({
        content: JSON.stringify(sampleSurveyContent),
        status: "IN_PROGRESS",
      });

      vi.mocked(prisma.surveyTemplate.create).mockResolvedValueOnce(
        newTemplate,
      );
      vi.mocked(prisma.client.findUnique).mockResolvedValueOnce(
        createMockClient(),
      );
      vi.mocked(prisma.appointment.findUnique).mockResolvedValueOnce(
        createMockAppointment(),
      );
      vi.mocked(prisma.surveyAnswers.findFirst).mockResolvedValueOnce(null);
      vi.mocked(prisma.surveyAnswers.create).mockResolvedValueOnce(newAnswer);

      const requestBody = {
        name: "Mental Status Exam",
        description: "Test description",
        content: validMentalStatusContent,
        client_id: "test-client-id",
        appointment_id: "test-appointment-id",
        survey_content: sampleSurveyContent,
        status: "IN_PROGRESS",
      };

      const request = createRequestWithBody(
        "/api/mental-status-exam",
        requestBody,
      );
      const response = await POST(request);

      expect(response.status).toBe(201);

      const responseData = await response.json();
      expect(responseData.template.id).toBe("test-template-id");
      expect(responseData.survey_answer.id).toBe("test-answer-id");
      expect(responseData.survey_answer.content).toEqual(sampleSurveyContent);
      expect(responseData.survey_answer.status).toBe("IN_PROGRESS");
      expect(responseData.message).toBe(
        "Mental Status Exam template and survey answer created successfully",
      );

      expect(prisma.surveyAnswers.create).toHaveBeenCalledWith({
        data: {
          template_id: "test-template-id",
          client_id: "test-client-id",
          appointment_id: "test-appointment-id",
          content: JSON.stringify(sampleSurveyContent),
          status: "IN_PROGRESS",
          assigned_at: expect.any(Date),
          completed_at: null,
        },
      });
    });

    it("should update existing survey answer when one already exists", async () => {
      const newTemplate = createMockTemplate();
      const existingAnswer = createMockSurveyAnswer();
      const updatedAnswer = createMockSurveyAnswer({
        content: JSON.stringify(sampleSurveyContent),
        status: "COMPLETED",
        completed_at: new Date(),
      });

      vi.mocked(prisma.surveyTemplate.create).mockResolvedValueOnce(
        newTemplate,
      );
      vi.mocked(prisma.client.findUnique).mockResolvedValueOnce(
        createMockClient(),
      );
      vi.mocked(prisma.appointment.findUnique).mockResolvedValueOnce(
        createMockAppointment(),
      );
      vi.mocked(prisma.surveyAnswers.findFirst).mockResolvedValueOnce(
        existingAnswer,
      );
      vi.mocked(prisma.surveyAnswers.update).mockResolvedValueOnce(
        updatedAnswer,
      );

      const requestBody = {
        name: "Mental Status Exam",
        content: validMentalStatusContent,
        client_id: "test-client-id",
        appointment_id: "test-appointment-id",
        survey_content: sampleSurveyContent,
        status: "COMPLETED",
      };

      const request = createRequestWithBody(
        "/api/mental-status-exam",
        requestBody,
      );
      const response = await POST(request);

      expect(response.status).toBe(201);

      const responseData = await response.json();
      expect(responseData.survey_answer.status).toBe("COMPLETED");
      expect(responseData.message).toBe(
        "Mental Status Exam template and survey answer created successfully",
      );

      expect(prisma.surveyAnswers.update).toHaveBeenCalledWith({
        where: { id: existingAnswer.id },
        data: expect.objectContaining({
          content: JSON.stringify(sampleSurveyContent),
          status: "COMPLETED",
          completed_at: expect.any(Date),
        }),
      });
    });

    it("should return 400 for missing required fields", async () => {
      const requestBody = {
        content: validMentalStatusContent,
        // missing name
      };

      const request = createRequestWithBody(
        "/api/mental-status-exam",
        requestBody,
      );
      const response = await POST(request);

      expect(response.status).toBe(400);

      const responseData = await response.json();
      expect(responseData.error).toBe("Name and content are required");
    });

    it("should return 400 for invalid content structure", async () => {
      const requestBody = {
        name: "Mental Status Exam",
        content: {
          appearance: "Normal",
          // missing required fields
        },
      };

      const request = createRequestWithBody(
        "/api/mental-status-exam",
        requestBody,
      );
      const response = await POST(request);

      expect(response.status).toBe(400);

      const responseData = await response.json();
      expect(responseData.error).toBe("Invalid content structure");
      expect(responseData.details).toContain(
        "Content must include all required fields",
      );
    });

    it("should return 400 when only client_id provided without appointment_id", async () => {
      const requestBody = {
        name: "Mental Status Exam",
        content: validMentalStatusContent,
        client_id: "test-client-id",
        // missing appointment_id
      };

      const request = createRequestWithBody(
        "/api/mental-status-exam",
        requestBody,
      );
      const response = await POST(request);

      expect(response.status).toBe(400);

      const responseData = await response.json();
      expect(responseData.error).toBe(
        "Both client_id and appointment_id are required when creating survey answers",
      );
    });

    it("should return 400 for invalid status", async () => {
      const requestBody = {
        name: "Mental Status Exam",
        content: validMentalStatusContent,
        client_id: "test-client-id",
        appointment_id: "test-appointment-id",
        status: "INVALID_STATUS",
      };

      const request = createRequestWithBody(
        "/api/mental-status-exam",
        requestBody,
      );
      const response = await POST(request);

      expect(response.status).toBe(400);

      const responseData = await response.json();
      expect(responseData.error).toContain("Invalid status");
    });

    it("should return 400 when client not found for survey answer", async () => {
      const newTemplate = createMockTemplate();
      vi.mocked(prisma.surveyTemplate.create).mockResolvedValueOnce(
        newTemplate,
      );
      vi.mocked(prisma.client.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.appointment.findUnique).mockResolvedValueOnce(
        createMockAppointment(),
      );

      const requestBody = {
        name: "Mental Status Exam",
        content: validMentalStatusContent,
        client_id: "non-existent-client",
        appointment_id: "test-appointment-id",
      };

      const request = createRequestWithBody(
        "/api/mental-status-exam",
        requestBody,
      );
      const response = await POST(request);

      expect(response.status).toBe(400);

      const responseData = await response.json();
      expect(responseData.error).toBe("Client not found");
    });

    it("should return 400 when appointment not found for survey answer", async () => {
      const newTemplate = createMockTemplate();
      vi.mocked(prisma.surveyTemplate.create).mockResolvedValueOnce(
        newTemplate,
      );
      vi.mocked(prisma.client.findUnique).mockResolvedValueOnce(
        createMockClient(),
      );
      vi.mocked(prisma.appointment.findUnique).mockResolvedValueOnce(null);

      const requestBody = {
        name: "Mental Status Exam",
        content: validMentalStatusContent,
        client_id: "test-client-id",
        appointment_id: "non-existent-appointment",
      };

      const request = createRequestWithBody(
        "/api/mental-status-exam",
        requestBody,
      );
      const response = await POST(request);

      expect(response.status).toBe(400);

      const responseData = await response.json();
      expect(responseData.error).toBe("Appointment not found");
    });

    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(getClinicianInfo).mockResolvedValueOnce(null as never);

      const requestBody = {
        name: "Mental Status Exam",
        content: validMentalStatusContent,
      };

      const request = createRequestWithBody(
        "/api/mental-status-exam",
        requestBody,
      );
      const response = await POST(request);

      expect(response.status).toBe(401);

      const responseData = await response.json();
      expect(responseData.error).toBe("Unauthorized");
    });

    it("should handle Prisma unique constraint violation", async () => {
      // Create a proper Prisma error using the actual Prisma error class structure
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed",
        {
          code: "P2002",
          clientVersion: "5.0.0",
          meta: { target: ["name"] },
        },
      );

      vi.mocked(prisma.surveyTemplate.create).mockRejectedValueOnce(
        prismaError,
      );

      const requestBody = {
        name: "Mental Status Exam",
        content: validMentalStatusContent,
      };

      const request = createRequestWithBody(
        "/api/mental-status-exam",
        requestBody,
      );
      const response = await POST(request);

      expect(response.status).toBe(409);

      const responseData = await response.json();
      expect(responseData.error).toBe("Template with this name already exists");
    });

    it("should handle name length validation", async () => {
      const requestBody = {
        name: "A".repeat(256), // 256 characters, exceeds 255 limit
        content: validMentalStatusContent,
      };

      const request = createRequestWithBody(
        "/api/mental-status-exam",
        requestBody,
      );
      const response = await POST(request);

      expect(response.status).toBe(400);

      const responseData = await response.json();
      expect(responseData.error).toBe("Name must be 255 characters or less");
    });

    it("should set completed_at when status is COMPLETED", async () => {
      const newTemplate = createMockTemplate();
      const newAnswer = createMockSurveyAnswer({
        status: "COMPLETED",
        completed_at: new Date(),
      });

      vi.mocked(prisma.surveyTemplate.create).mockResolvedValueOnce(
        newTemplate,
      );
      vi.mocked(prisma.client.findUnique).mockResolvedValueOnce(
        createMockClient(),
      );
      vi.mocked(prisma.appointment.findUnique).mockResolvedValueOnce(
        createMockAppointment(),
      );
      vi.mocked(prisma.surveyAnswers.findFirst).mockResolvedValueOnce(null);
      vi.mocked(prisma.surveyAnswers.create).mockResolvedValueOnce(newAnswer);

      const requestBody = {
        name: "Mental Status Exam",
        content: validMentalStatusContent,
        client_id: "test-client-id",
        appointment_id: "test-appointment-id",
        status: "COMPLETED",
      };

      const request = createRequestWithBody(
        "/api/mental-status-exam",
        requestBody,
      );
      const response = await POST(request);

      expect(response.status).toBe(201);

      expect(prisma.surveyAnswers.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: "COMPLETED",
          completed_at: expect.any(Date),
        }),
      });
    });
  });

  describe("DELETE /api/mental-status-exam", () => {
    it("should delete template and associated survey answers successfully", async () => {
      const mockTemplate = createMockTemplate();
      vi.mocked(prisma.surveyTemplate.findUnique).mockResolvedValueOnce(
        mockTemplate,
      );
      vi.mocked(prisma.surveyAnswers.deleteMany).mockResolvedValueOnce({
        count: 2,
      });
      vi.mocked(prisma.surveyTemplate.delete).mockResolvedValueOnce(
        mockTemplate,
      );

      const request = createRequest(
        "/api/mental-status-exam?id=test-template-id",
        { method: "DELETE" },
      );
      const response = await DELETE(request);

      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData.message).toBe(
        "Template and associated survey answers deleted successfully",
      );
      expect(responseData.template.id).toBe("test-template-id");
      expect(responseData.template.content).toEqual(validMentalStatusContent);

      expect(prisma.surveyTemplate.findUnique).toHaveBeenCalledWith({
        where: {
          id: "test-template-id",
          type: "MENTAL_STATUS_EXAM",
        },
      });
      expect(prisma.surveyAnswers.deleteMany).toHaveBeenCalledWith({
        where: { template_id: "test-template-id" },
      });
      expect(prisma.surveyTemplate.delete).toHaveBeenCalledWith({
        where: { id: "test-template-id" },
      });
    });

    it("should return 404 when template not found for deletion", async () => {
      vi.mocked(prisma.surveyTemplate.findUnique).mockResolvedValueOnce(null);

      const request = createRequest(
        "/api/mental-status-exam?id=non-existent-id",
        { method: "DELETE" },
      );
      const response = await DELETE(request);

      expect(response.status).toBe(404);

      const responseData = await response.json();
      expect(responseData.error).toBe("Template not found");

      expect(prisma.surveyAnswers.deleteMany).not.toHaveBeenCalled();
      expect(prisma.surveyTemplate.delete).not.toHaveBeenCalled();
    });

    it("should return 400 when ID parameter is missing for deletion", async () => {
      const request = createRequest("/api/mental-status-exam", {
        method: "DELETE",
      });
      const response = await DELETE(request);

      expect(response.status).toBe(400);

      const responseData = await response.json();
      expect(responseData.error).toBe("Template ID is required");

      expect(prisma.surveyTemplate.findUnique).not.toHaveBeenCalled();
      expect(prisma.surveyAnswers.deleteMany).not.toHaveBeenCalled();
      expect(prisma.surveyTemplate.delete).not.toHaveBeenCalled();
    });

    it("should return 401 when user is not authenticated for deletion", async () => {
      vi.mocked(getClinicianInfo).mockResolvedValueOnce(null as never);

      const request = createRequest(
        "/api/mental-status-exam?id=test-template-id",
        { method: "DELETE" },
      );
      const response = await DELETE(request);

      expect(response.status).toBe(401);

      const responseData = await response.json();
      expect(responseData.error).toBe("Unauthorized");

      expect(prisma.surveyTemplate.findUnique).not.toHaveBeenCalled();
    });

    it("should handle Prisma deletion errors", async () => {
      const mockTemplate = createMockTemplate();
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Record not found",
        {
          code: "P2025",
          clientVersion: "5.0.0",
        },
      );

      vi.mocked(prisma.surveyTemplate.findUnique).mockResolvedValueOnce(
        mockTemplate,
      );
      vi.mocked(prisma.surveyAnswers.deleteMany).mockResolvedValueOnce({
        count: 0,
      });
      vi.mocked(prisma.surveyTemplate.delete).mockRejectedValueOnce(
        prismaError,
      );

      const request = createRequest(
        "/api/mental-status-exam?id=test-template-id",
        { method: "DELETE" },
      );
      const response = await DELETE(request);

      expect(response.status).toBe(404);

      const responseData = await response.json();
      expect(responseData.error).toBe("Template not found");
    });
  });
});
