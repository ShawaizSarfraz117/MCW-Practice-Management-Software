import { describe, it, expect, beforeEach, vi } from "vitest";
import { PUT } from "@/api/appointmentNote/route";
import prismaMock from "@mcw/database/mock";
import { createRequestWithBody } from "@mcw/utils";
import { getBackOfficeSession } from "@/utils/helpers";
import type { Session } from "next-auth";
import type { SurveyAnswers } from "@mcw/database";

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

const mockTemplate = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  name: "Progress Note Template",
  type: "PROGRESS_NOTES",
  content: "{}",
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
  frequency_options: null,
  description: null,
  is_default: false,
  requires_signature: false,
  is_shareable: false,
};

const mockClient = {
  id: "456e7890-e89b-12d3-a456-426614174000",
  legal_first_name: "John",
  legal_last_name: "Doe",
  is_active: true,
  is_waitlist: false,
  primary_clinician_id: null,
  primary_location_id: null,
  allow_online_appointment: false,
  access_billing_documents: false,
  use_secure_messaging: false,
  referred_by: null,
  created_at: new Date(),
  date_of_birth: null,
  preferred_name: null,
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
  SurveyTemplate: mockTemplate,
  Client: mockClient,
};

describe("appointmentNote API - PUT Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getBackOfficeSession).mockResolvedValue(mockSession as Session);
  });

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
      { method: "PUT" },
    );
    const response = await PUT(request);

    expect(response.status).toBe(401);
  });

  it("should update existing note by appointment_id", async () => {
    prismaMock.surveyAnswers.findFirst.mockResolvedValue(
      mockSurveyAnswer as unknown as SurveyAnswers,
    );
    prismaMock.surveyAnswers.update.mockResolvedValue({
      ...mockSurveyAnswer,
      content: '{"question1": "updated answer"}',
      status: "UPDATED",
    } as SurveyAnswers);

    const request = createRequestWithBody(
      "/api/appointmentNote",
      updatePayload,
      { method: "PUT" },
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
    });
  });

  it("should support appointment_id in payload", async () => {
    const payloadWithAppointmentId = {
      appointment_id: "abc12345-e89b-12d3-a456-426614174000",
      content: '{"question1": "updated answer"}',
    };

    prismaMock.surveyAnswers.findFirst.mockResolvedValue(
      mockSurveyAnswer as unknown as SurveyAnswers,
    );
    prismaMock.surveyAnswers.update.mockResolvedValue(
      mockSurveyAnswer as unknown as SurveyAnswers,
    );

    const request = createRequestWithBody(
      "/api/appointmentNote",
      payloadWithAppointmentId,
      { method: "PUT" },
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
      { method: "PUT" },
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
      { method: "PUT" },
    );
    const response = await PUT(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Note ID or appointment ID is required");
  });
});
