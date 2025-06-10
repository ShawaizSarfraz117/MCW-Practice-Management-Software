/* eslint-disable max-lines-per-function */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET, POST, PUT, DELETE } from "@/api/appointmentNote/route";
import prismaMock from "@mcw/database/mock";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { getBackOfficeSession } from "@/utils/helpers";
import type { Session } from "next-auth";
import type { SurveyAnswers, SurveyTemplate, Client } from "@mcw/database";

type SurveyAnswerWithRelations = SurveyAnswers & {
  SurveyTemplate: SurveyTemplate | null;
  Client: Client | null;
};

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

const mockTemplate = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  name: "Progress Note Template",
  type: "PROGRESS_NOTES",
  content: "{}",
  is_active: true,
  practice_id: "987e6543-e21b-12d3-a456-426614174000",
  created_at: new Date(),
  updated_at: new Date(),
};

const mockClient = {
  id: "456e7890-e89b-12d3-a456-426614174000",
  first_name: "John",
  last_name: "Doe",
  email: "john@example.com",
  phone_primary: "1234567890",
  practice_id: "987e6543-e21b-12d3-a456-426614174000",
  created_at: new Date(),
  updated_at: new Date(),
};

const mockSurveyAnswer = {
  id: "789e0123-e89b-12d3-a456-426614174000",
  template_id: "123e4567-e89b-12d3-a456-426614174000",
  client_id: "456e7890-e89b-12d3-a456-426614174000",
  content: '{"question1": "answer1"}',
  status: "COMPLETED",
  appointment_id: "abc12345-e89b-12d3-a456-426614174000",
  is_signed: false,
  is_locked: false,
  completed_at: new Date(),
  assigned_at: new Date(),
  expiry_date: null,
  frequency: null,
  is_intake: false,
  created_at: new Date(),
  updated_at: new Date(),
  template: mockTemplate,
  client: mockClient,
};

describe("appointmentNote API - Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getBackOfficeSession).mockResolvedValue(mockSession as Session);
  });

  describe("GET", () => {
    it("should return 401 if not authenticated", async () => {
      vi.mocked(getBackOfficeSession).mockResolvedValue(null);

      const request = createRequest("/api/appointmentNote");
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("should fetch note by appointment_id", async () => {
      prismaMock.surveyAnswers.findFirst.mockResolvedValue(
        mockSurveyAnswer as SurveyAnswerWithRelations,
      );

      const request = createRequest(
        "/api/appointmentNote?appointment_id=abc12345-e89b-12d3-a456-426614174000",
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe("789e0123-e89b-12d3-a456-426614174000");
      expect(prismaMock.surveyAnswers.findFirst).toHaveBeenCalledWith({
        where: { appointment_id: "abc12345-e89b-12d3-a456-426614174000" },
        include: {
          template: true,
          client: true,
        },
      });
    });

    it("should support legacy 'id' parameter as appointment_id", async () => {
      prismaMock.surveyAnswers.findFirst.mockResolvedValue(
        mockSurveyAnswer as SurveyAnswerWithRelations,
      );

      const request = createRequest(
        "/api/appointmentNote?id=abc12345-e89b-12d3-a456-426614174000",
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(prismaMock.surveyAnswers.findFirst).toHaveBeenCalledWith({
        where: { appointment_id: "abc12345-e89b-12d3-a456-426614174000" },
        include: {
          template: true,
          client: true,
        },
      });
    });

    it("should return 404 if note not found", async () => {
      prismaMock.surveyAnswers.findFirst.mockResolvedValue(null);

      const request = createRequest(
        "/api/appointmentNote?appointment_id=nonexistent",
      );
      const response = await GET(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Note not found for this appointment");
    });

    it("should fetch all notes by client_id", async () => {
      prismaMock.surveyAnswers.findMany.mockResolvedValue([
        mockSurveyAnswer,
      ] as SurveyAnswerWithRelations);

      const request = createRequest(
        "/api/appointmentNote?client_id=456e7890-e89b-12d3-a456-426614174000",
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveLength(1);
      expect(prismaMock.surveyAnswers.findMany).toHaveBeenCalledWith({
        where: { client_id: "456e7890-e89b-12d3-a456-426614174000" },
        include: {
          template: true,
          client: true,
        },
        orderBy: {
          created_at: "desc",
        },
      });
    });
  });

  describe("POST", () => {
    const validPayload = {
      template_id: "123e4567-e89b-12d3-a456-426614174000",
      client_id: "456e7890-e89b-12d3-a456-426614174000",
      content: '{"question1": "answer1"}',
      status: "COMPLETED",
      appointment_id: "abc12345-e89b-12d3-a456-426614174000",
    };

    it("should return 401 if not authenticated", async () => {
      vi.mocked(getBackOfficeSession).mockResolvedValue(null);

      const request = createRequestWithBody(
        "/api/appointmentNote",
        validPayload,
      );
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it("should create a new note", async () => {
      prismaMock.surveyAnswers.findFirst.mockResolvedValue(null);
      prismaMock.surveyAnswers.create.mockResolvedValue(
        mockSurveyAnswer as SurveyAnswerWithRelations,
      );

      const request = createRequestWithBody(
        "/api/appointmentNote",
        validPayload,
      );
      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.id).toBe("789e0123-e89b-12d3-a456-426614174000");
      expect(prismaMock.surveyAnswers.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          template_id: "123e4567-e89b-12d3-a456-426614174000",
          client_id: "456e7890-e89b-12d3-a456-426614174000",
          content: '{"question1": "answer1"}',
          status: "COMPLETED",
          appointment_id: "abc12345-e89b-12d3-a456-426614174000",
        }),
        include: {
          template: true,
          client: true,
        },
      });
    });

    it("should return 409 if note already exists for appointment and template", async () => {
      prismaMock.surveyAnswers.findFirst.mockResolvedValue(
        mockSurveyAnswer as SurveyAnswerWithRelations,
      );

      const request = createRequestWithBody(
        "/api/appointmentNote",
        validPayload,
      );
      const response = await POST(request);

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error).toBe(
        "A note already exists for this appointment and template",
      );
    });

    it("should return 400 for invalid input", async () => {
      const invalidPayload = {
        template_id: "invalid-uuid",
        client_id: "456e7890-e89b-12d3-a456-426614174000",
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
  });

  describe("PUT", () => {
    const updatePayload = {
      id: "abc12345-e89b-12d3-a456-426614174000",
      content: '{"question1": "updated answer"}',
      status: "UPDATED",
    };

    it("should return 401 if not authenticated", async () => {
      vi.mocked(getBackOfficeSession).mockResolvedValue(null);

      const request = createRequestWithBody(
        "/api/appointmentNote",
        updatePayload,
        "PUT",
      );
      const response = await PUT(request);

      expect(response.status).toBe(401);
    });

    it("should update existing note by appointment_id", async () => {
      prismaMock.surveyAnswers.findFirst.mockResolvedValue(
        mockSurveyAnswer as SurveyAnswerWithRelations,
      );
      prismaMock.surveyAnswers.update.mockResolvedValue({
        ...mockSurveyAnswer,
        content: '{"question1": "updated answer"}',
        status: "UPDATED",
      } as SurveyAnswers);

      const request = createRequestWithBody(
        "/api/appointmentNote",
        updatePayload,
        "PUT",
      );
      const response = await PUT(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.content).toBe('{"question1": "updated answer"}');
      expect(prismaMock.surveyAnswers.update).toHaveBeenCalledWith({
        where: { id: "789e0123-e89b-12d3-a456-426614174000" },
        data: expect.objectContaining({
          content: '{"question1": "updated answer"}',
          status: "UPDATED",
        }),
        include: {
          template: true,
          client: true,
        },
      });
    });

    it("should support appointment_id in payload", async () => {
      const payloadWithAppointmentId = {
        appointment_id: "abc12345-e89b-12d3-a456-426614174000",
        content: '{"question1": "updated answer"}',
      };

      prismaMock.surveyAnswers.findFirst.mockResolvedValue(
        mockSurveyAnswer as SurveyAnswerWithRelations,
      );
      prismaMock.surveyAnswers.update.mockResolvedValue(
        mockSurveyAnswer as SurveyAnswerWithRelations,
      );

      const request = createRequestWithBody(
        "/api/appointmentNote",
        payloadWithAppointmentId,
        "PUT",
      );
      const response = await PUT(request);

      expect(response.status).toBe(200);
      expect(prismaMock.surveyAnswers.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { id: "abc12345-e89b-12d3-a456-426614174000" },
            { appointment_id: "abc12345-e89b-12d3-a456-426614174000" },
          ],
        },
      });
    });

    it("should return 404 if note not found", async () => {
      prismaMock.surveyAnswers.findFirst.mockResolvedValue(null);

      const request = createRequestWithBody(
        "/api/appointmentNote",
        updatePayload,
        "PUT",
      );
      const response = await PUT(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Note not found");
    });

    it("should return 400 if no id provided", async () => {
      const request = createRequestWithBody(
        "/api/appointmentNote",
        { content: "test" },
        "PUT",
      );
      const response = await PUT(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Note ID or appointment ID is required");
    });
  });

  describe("DELETE", () => {
    it("should return 401 if not authenticated", async () => {
      vi.mocked(getBackOfficeSession).mockResolvedValue(null);

      const request = createRequest(
        "/api/appointmentNote?id=789e0123-e89b-12d3-a456-426614174000",
      );
      const response = await DELETE(request);

      expect(response.status).toBe(401);
    });

    it("should delete note by id", async () => {
      prismaMock.surveyAnswers.findFirst.mockResolvedValue(
        mockSurveyAnswer as SurveyAnswerWithRelations,
      );
      prismaMock.surveyAnswers.delete.mockResolvedValue(
        mockSurveyAnswer as SurveyAnswerWithRelations,
      );

      const request = createRequest(
        "/api/appointmentNote?id=789e0123-e89b-12d3-a456-426614174000",
      );
      const response = await DELETE(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe("Note deleted successfully");
      expect(data.id).toBe("789e0123-e89b-12d3-a456-426614174000");
      expect(prismaMock.surveyAnswers.delete).toHaveBeenCalledWith({
        where: { id: "789e0123-e89b-12d3-a456-426614174000" },
      });
    });

    it("should delete note by appointment_id", async () => {
      prismaMock.surveyAnswers.findFirst.mockResolvedValue(
        mockSurveyAnswer as SurveyAnswerWithRelations,
      );
      prismaMock.surveyAnswers.delete.mockResolvedValue(
        mockSurveyAnswer as SurveyAnswerWithRelations,
      );

      const request = createRequest(
        "/api/appointmentNote?appointment_id=abc12345-e89b-12d3-a456-426614174000",
      );
      const response = await DELETE(request);

      expect(response.status).toBe(200);
      expect(prismaMock.surveyAnswers.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { id: "abc12345-e89b-12d3-a456-426614174000" },
            { appointment_id: "abc12345-e89b-12d3-a456-426614174000" },
          ],
        },
      });
    });

    it("should return 404 if note not found", async () => {
      prismaMock.surveyAnswers.findFirst.mockResolvedValue(null);

      const request = createRequest("/api/appointmentNote?id=nonexistent");
      const response = await DELETE(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Note not found");
    });

    it("should return 400 if no id provided", async () => {
      const request = createRequest("/api/appointmentNote");
      const response = await DELETE(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Note ID or appointment ID is required");
    });
  });
});
