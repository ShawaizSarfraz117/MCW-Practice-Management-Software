/* eslint-disable max-lines-per-function */
import { beforeEach, describe, expect, it, vi, Mock } from "vitest";
import { GET } from "@/api/survey-templates/route";
import { createRequest } from "@mcw/utils";

// Mock logger
vi.mock("@mcw/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock helpers
vi.mock("@/utils/helpers", () => ({
  getClinicianInfo: vi.fn(),
}));

// Mock prisma
vi.mock("@mcw/database", () => {
  const findManyMock = vi.fn();
  const countMock = vi.fn();

  return {
    prisma: {
      surveyTemplate: {
        findMany: findManyMock,
        count: countMock,
      },
    },
  };
});

import { prisma } from "@mcw/database";
import { getClinicianInfo } from "@/utils/helpers";

describe("Survey Templates API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("should retrieve survey templates with default parameters", async () => {
      // Set up authenticated user
      (getClinicianInfo as Mock).mockResolvedValue({
        isClinician: true,
        clinicianId: "test-clinician-id",
      });

      const mockTemplates = [
        {
          id: "template-1",
          name: "Template 1",
          type: "DIAGNOSIS_AND_TREATMENT_PLANS",
          content: JSON.stringify({
            sections: [{ title: "Section 1", questions: [] }],
          }),
          is_active: true,
          created_at: new Date("2025-01-01"),
          SurveyAnswers: [],
        },
        {
          id: "template-2",
          name: "Template 2",
          type: "ASSESSMENT",
          content: JSON.stringify({
            sections: [{ title: "Section 2", questions: [] }],
          }),
          is_active: true,
          created_at: new Date("2025-01-02"),
          SurveyAnswers: [],
        },
      ];

      (prisma.surveyTemplate.count as Mock).mockResolvedValue(2);
      (prisma.surveyTemplate.findMany as Mock).mockResolvedValue(mockTemplates);

      const request = createRequest("/api/survey-templates");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(2);
      expect(data.data[0].content).toEqual({
        sections: [{ title: "Section 1", questions: [] }],
      });
      expect(data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });

      expect(prisma.surveyTemplate.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          SurveyAnswers: {
            where: undefined,
            include: {
              Client: {
                select: {
                  id: true,
                  legal_first_name: true,
                  legal_last_name: true,
                },
              },
              Appointment: {
                select: {
                  id: true,
                  start_date: true,
                  end_date: true,
                  type: true,
                },
              },
            },
          },
        },
        orderBy: { created_at: "desc" },
        skip: 0,
        take: 20,
      });
    });

    it("should filter templates by type", async () => {
      // Set up authenticated user
      (getClinicianInfo as Mock).mockResolvedValue({
        isClinician: true,
        clinicianId: "test-clinician-id",
      });

      const mockTemplates = [
        {
          id: "template-1",
          name: "Diagnosis Template",
          type: "DIAGNOSIS_AND_TREATMENT_PLANS",
          content: "{}",
          is_active: true,
          created_at: new Date(),
        },
      ];

      (prisma.surveyTemplate.count as Mock).mockResolvedValue(1);
      (prisma.surveyTemplate.findMany as Mock).mockResolvedValue(mockTemplates);

      const request = createRequest(
        "/api/survey-templates?type=DIAGNOSIS_AND_TREATMENT_PLANS",
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].type).toBe("DIAGNOSIS_AND_TREATMENT_PLANS");

      expect(prisma.surveyTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { type: "DIAGNOSIS_AND_TREATMENT_PLANS" },
        }),
      );
    });

    it("should filter templates by active status", async () => {
      // Set up authenticated user
      (getClinicianInfo as Mock).mockResolvedValue({
        isClinician: true,
        clinicianId: "test-clinician-id",
      });

      (prisma.surveyTemplate.count as Mock).mockResolvedValue(0);
      (prisma.surveyTemplate.findMany as Mock).mockResolvedValue([]);

      const request = createRequest("/api/survey-templates?is_active=false");

      const response = await GET(request);
      await response.json();

      expect(response.status).toBe(200);
      expect(prisma.surveyTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { is_active: false },
        }),
      );
    });

    it("should include survey answers filtered by client ID", async () => {
      // Set up authenticated user
      (getClinicianInfo as Mock).mockResolvedValue({
        isClinician: true,
        clinicianId: "test-clinician-id",
      });

      const mockTemplates = [
        {
          id: "template-1",
          name: "Template with Answers",
          type: "ASSESSMENT",
          content: "{}",
          is_active: true,
          created_at: new Date(),
          SurveyAnswers: [
            {
              id: "answer-1",
              client_id: "client-123",
              content: JSON.stringify({ q1: "Answer 1" }),
              status: "COMPLETED",
              Client: {
                id: "client-123",
                legal_first_name: "John",
                legal_last_name: "Doe",
              },
              Appointment: null,
            },
          ],
        },
      ];

      (prisma.surveyTemplate.count as Mock).mockResolvedValue(1);
      (prisma.surveyTemplate.findMany as Mock).mockResolvedValue(mockTemplates);

      const request = createRequest(
        "/api/survey-templates?client_id=client-123&include_answers=true",
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data[0].SurveyAnswers).toHaveLength(1);
      expect(data.data[0].SurveyAnswers[0].content).toEqual({ q1: "Answer 1" });

      expect(prisma.surveyTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            SurveyAnswers: {
              where: { client_id: "client-123" },
              include: expect.any(Object),
            },
          },
        }),
      );
    });

    it("should exclude survey answers when requested", async () => {
      // Set up authenticated user
      (getClinicianInfo as Mock).mockResolvedValue({
        isClinician: true,
        clinicianId: "test-clinician-id",
      });

      const mockTemplates = [
        {
          id: "template-1",
          name: "Template without Answers",
          type: "ASSESSMENT",
          content: "{}",
          is_active: true,
          created_at: new Date(),
        },
      ];

      (prisma.surveyTemplate.count as Mock).mockResolvedValue(1);
      (prisma.surveyTemplate.findMany as Mock).mockResolvedValue(mockTemplates);

      const request = createRequest(
        "/api/survey-templates?include_answers=false",
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data[0].SurveyAnswers).toBeUndefined();

      expect(prisma.surveyTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {},
        }),
      );
    });

    it("should handle pagination", async () => {
      // Set up authenticated user
      (getClinicianInfo as Mock).mockResolvedValue({
        isClinician: true,
        clinicianId: "test-clinician-id",
      });

      (prisma.surveyTemplate.count as Mock).mockResolvedValue(50);
      (prisma.surveyTemplate.findMany as Mock).mockResolvedValue([]);

      const request = createRequest("/api/survey-templates?page=3&limit=15");

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination).toEqual({
        page: 3,
        limit: 15,
        total: 50,
        totalPages: 4,
      });

      expect(prisma.surveyTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 30, // (page - 1) * limit = (3 - 1) * 15
          take: 15,
        }),
      );
    });

    it("should return 401 when unauthorized", async () => {
      (getClinicianInfo as Mock).mockResolvedValue(null);

      const request = createRequest("/api/survey-templates");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should handle errors gracefully", async () => {
      // Set up authenticated user
      (getClinicianInfo as Mock).mockResolvedValue({
        isClinician: true,
        clinicianId: "test-clinician-id",
      });

      (prisma.surveyTemplate.count as Mock).mockRejectedValue(
        new Error("Database connection error"),
      );

      const request = createRequest("/api/survey-templates");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      // In development, withErrorHandling returns detailed error info
      expect(data).toHaveProperty("message", "Database connection error");
      expect(data).toHaveProperty("issueId");
      expect(data.issueId).toMatch(/^ERR-\d{8}-\d{6}-[A-Z0-9]{4}$/);
    });

    it("should parse nested JSON content correctly", async () => {
      // Set up authenticated user
      (getClinicianInfo as Mock).mockResolvedValue({
        isClinician: true,
        clinicianId: "test-clinician-id",
      });

      const mockTemplates = [
        {
          id: "template-1",
          name: "Complex Template",
          type: "ASSESSMENT",
          content: JSON.stringify({
            sections: [
              {
                title: "Section 1",
                questions: [
                  { id: "q1", text: "Question 1", type: "text" },
                  {
                    id: "q2",
                    text: "Question 2",
                    type: "checkbox",
                    options: ["A", "B"],
                  },
                ],
              },
            ],
          }),
          is_active: true,
          created_at: new Date(),
          SurveyAnswers: [
            {
              id: "answer-1",
              content: JSON.stringify({
                q1: "Text answer",
                q2: ["A"],
              }),
              status: "COMPLETED",
              Client: null,
              Appointment: null,
            },
          ],
        },
      ];

      (prisma.surveyTemplate.count as Mock).mockResolvedValue(1);
      (prisma.surveyTemplate.findMany as Mock).mockResolvedValue(mockTemplates);

      const request = createRequest("/api/survey-templates");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data[0].content.sections[0].questions).toHaveLength(2);
      expect(data.data[0].SurveyAnswers[0].content.q1).toBe("Text answer");
      expect(data.data[0].SurveyAnswers[0].content.q2).toEqual(["A"]);
    });
  });
});
