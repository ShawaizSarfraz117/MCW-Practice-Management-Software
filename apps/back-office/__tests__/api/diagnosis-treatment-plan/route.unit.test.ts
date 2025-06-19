/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-lines-per-function */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST, PUT, DELETE } from "@/api/diagnosis-treatment-plan/route";
import { createRequest, createRequestWithBody } from "@mcw/utils";

// Mock logger
vi.mock("@mcw/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock prisma
vi.mock("@mcw/database", () => {
  const findUniqueMock = vi.fn();
  const findManyMock = vi.fn();
  const createMock = vi.fn();
  const updateMock = vi.fn();
  const deleteMock = vi.fn();
  const deleteItemsManyMock = vi.fn();
  const createItemsManyMock = vi.fn();
  const updateItemsManyMock = vi.fn();
  const countMock = vi.fn();
  const surveyAnswersCreateMock = vi.fn();
  const surveyAnswersUpdateMock = vi.fn();
  const surveyAnswersDeleteMock = vi.fn();
  const appointmentNotesCountMock = vi.fn();
  const clientFilesCountMock = vi.fn();

  const transactionMock = vi.fn().mockImplementation(async (callback) => {
    const prismaMock = {
      diagnosisTreatmentPlan: {
        findUnique: findUniqueMock,
        create: createMock,
        update: updateMock,
        delete: deleteMock,
      },
      diagnosisTreatmentPlanItem: {
        findMany: vi.fn().mockResolvedValue([]),
        createMany: createItemsManyMock,
        deleteMany: deleteItemsManyMock,
        updateMany: updateItemsManyMock,
      },
      surveyAnswers: {
        create: surveyAnswersCreateMock,
        update: surveyAnswersUpdateMock,
        delete: surveyAnswersDeleteMock,
      },
      appointmentNotes: {
        count: appointmentNotesCountMock,
      },
      clientFiles: {
        count: clientFilesCountMock,
      },
      client: {
        findUnique: vi.fn(),
      },
    };

    return await callback(prismaMock);
  });

  return {
    prisma: {
      diagnosisTreatmentPlan: {
        findUnique: findUniqueMock,
        findMany: findManyMock,
        create: createMock,
        update: updateMock,
        delete: deleteMock,
        count: countMock,
      },
      diagnosisTreatmentPlanItem: {
        findMany: vi.fn().mockResolvedValue([]),
        createMany: createItemsManyMock,
        deleteMany: deleteItemsManyMock,
        updateMany: updateItemsManyMock,
      },
      surveyAnswers: {
        create: surveyAnswersCreateMock,
        update: surveyAnswersUpdateMock,
        delete: surveyAnswersDeleteMock,
      },
      appointmentNotes: {
        count: appointmentNotesCountMock,
      },
      clientFiles: {
        count: clientFilesCountMock,
      },
      client: {
        findUnique: vi.fn(),
      },
      $transaction: transactionMock,
    },
  };
});

import { prisma } from "@mcw/database";

describe("Diagnosis Treatment Plan API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("should fetch a specific treatment plan by planId", async () => {
      const mockPlan = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        client_id: "123e4567-e89b-12d3-a456-426614174001",
        title: "Test Plan",
        DiagnosisTreatmentPlanItem: [
          {
            Diagnosis: {
              id: "diag-1",
              code: "F32.9",
              description: "Major depressive disorder",
            },
          },
        ],
        Client: {
          id: "123e4567-e89b-12d3-a456-426614174001",
          first_name: "John",
          last_name: "Doe",
        },
        SurveyAnswers: null,
      };

      (prisma.diagnosisTreatmentPlan.findUnique as any).mockResolvedValue(
        mockPlan,
      );

      const request = createRequest(
        "/api/diagnosis-treatment-plan?planId=123e4567-e89b-12d3-a456-426614174000",
      );

      const response = await GET(request);
      const data = await response.json();

      expect(prisma.diagnosisTreatmentPlan.findUnique).toHaveBeenCalledWith({
        where: { id: "123e4567-e89b-12d3-a456-426614174000" },
        include: {
          DiagnosisTreatmentPlanItem: {
            include: {
              Diagnosis: true,
            },
          },
          Client: true,
          SurveyAnswers: true,
        },
      });

      expect(data).toEqual(mockPlan);
      expect(response.status).toBe(200);
    });

    it("should return 404 when plan not found", async () => {
      (prisma.diagnosisTreatmentPlan.findUnique as any).mockResolvedValue(null);

      const request = createRequest(
        "/api/diagnosis-treatment-plan?planId=non-existent",
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.error).toBe("Treatment plan not found");
      expect(response.status).toBe(404);
    });

    it("should fetch all plans for a client", async () => {
      const mockPlans = [
        {
          id: "423e4567-e89b-12d3-a456-426614174000",
          client_id: "823e4567-e89b-12d3-a456-426614174001",
          title: "Plan 1",
          DiagnosisTreatmentPlanItem: [],
          SurveyAnswers: null,
        },
        {
          id: "523e4567-e89b-12d3-a456-426614174000",
          client_id: "823e4567-e89b-12d3-a456-426614174001",
          title: "Plan 2",
          DiagnosisTreatmentPlanItem: [],
          SurveyAnswers: null,
        },
      ];

      (prisma.diagnosisTreatmentPlan.findMany as any).mockResolvedValue(
        mockPlans,
      );

      const request = createRequest(
        "/api/diagnosis-treatment-plan?clientId=823e4567-e89b-12d3-a456-426614174001",
      );

      const response = await GET(request);
      const data = await response.json();

      expect(prisma.diagnosisTreatmentPlan.findMany).toHaveBeenCalledWith({
        where: { client_id: "823e4567-e89b-12d3-a456-426614174001" },
        include: {
          DiagnosisTreatmentPlanItem: {
            include: {
              Diagnosis: true,
            },
          },
          SurveyAnswers: true,
        },
        orderBy: { created_at: "desc" },
      });

      expect(data).toEqual(mockPlans);
      expect(response.status).toBe(200);
    });

    it("should return 400 when clientId is missing", async () => {
      const request = createRequest("/api/diagnosis-treatment-plan");

      const response = await GET(request);
      const data = await response.json();

      expect(data.error).toBe("Client ID is required");
      expect(response.status).toBe(400);
    });

    it("should handle errors gracefully", async () => {
      (prisma.diagnosisTreatmentPlan.findMany as any).mockRejectedValue(
        new Error("Database error"),
      );

      const request = createRequest(
        "/api/diagnosis-treatment-plan?clientId=923e4567-e89b-12d3-a456-426614174001",
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.error).toBe("Failed to fetch treatment plans");
      expect(response.status).toBe(500);
    });
  });

  describe("POST", () => {
    it("should create a new treatment plan with diagnoses", async () => {
      const mockCreatedPlan = {
        id: "new-plan-123",
        client_id: "client-123",
        title: "New Treatment Plan",
        DiagnosisTreatmentPlanItem: [
          {
            Diagnosis: {
              id: "diag-1",
              code: "F32.9",
              description: "Major depressive disorder",
            },
          },
        ],
        SurveyAnswers: null,
      };

      (prisma.client.findUnique as any).mockResolvedValue({
        id: "123e4567-e89b-12d3-a456-426614174001",
        first_name: "John",
        last_name: "Doe",
      });

      const createMock = vi.fn().mockResolvedValue({
        id: "new-plan-123",
        client_id: "client-123",
        title: "New Treatment Plan",
      });

      const findUniqueMock = vi.fn().mockResolvedValue(mockCreatedPlan);

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return await callback({
          client: {
            findUnique: prisma.client.findUnique,
          },
          diagnosisTreatmentPlan: {
            create: createMock,
            findUnique: findUniqueMock,
          },
          diagnosisTreatmentPlanItem: {
            findMany: vi.fn().mockResolvedValue([]),
            createMany: vi.fn(),
            updateMany: vi.fn(),
          },
        });
      });

      const requestBody = {
        clientId: "123e4567-e89b-12d3-a456-426614174001",
        title: "New Treatment Plan",
        diagnoses: [
          {
            id: "diag-1",
            code: "F32.9",
            description: "Major depressive disorder",
          },
        ],
        dateTime: "2025-01-15T10:00:00Z",
      };

      const request = createRequestWithBody(
        "/api/diagnosis-treatment-plan",
        requestBody,
      );
      const response = await POST(request);
      const data = await response.json();

      expect(prisma.client.findUnique).toHaveBeenCalledWith({
        where: { id: "123e4567-e89b-12d3-a456-426614174001" },
      });

      expect(createMock).toHaveBeenCalledWith({
        data: expect.objectContaining({
          client_id: "123e4567-e89b-12d3-a456-426614174001",
          title: "New Treatment Plan",
          survey_answers_id: null,
          created_at: new Date("2025-01-15T10:00:00Z"),
        }),
      });

      expect(data).toEqual(mockCreatedPlan);
      expect(response.status).toBe(201);
    });

    it("should return 400 when required fields are missing", async () => {
      const request = createRequestWithBody("/api/diagnosis-treatment-plan", {
        title: "Missing clientId",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.error).toBe("Client ID and title are required");
      expect(response.status).toBe(400);
    });

    it("should return 404 when client not found", async () => {
      (prisma.client.findUnique as any).mockResolvedValue(null);

      const request = createRequestWithBody("/api/diagnosis-treatment-plan", {
        clientId: "123e4567-e89b-12d3-a456-426614174001",
        title: "Test Plan",
        diagnoses: [],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.error).toBe(
        "Client not found with ID: 123e4567-e89b-12d3-a456-426614174001",
      );
      expect(response.status).toBe(404);
    });
  });

  describe("PUT", () => {
    it("should update an existing treatment plan", async () => {
      const mockExistingPlan = {
        id: "323e4567-e89b-12d3-a456-426614174000",
        survey_answers_id: null,
        SurveyAnswers: null,
      };

      const mockUpdatedPlan = {
        id: "323e4567-e89b-12d3-a456-426614174000",
        client_id: "123e4567-e89b-12d3-a456-426614174001",
        title: "Updated Plan",
        DiagnosisTreatmentPlanItem: [
          {
            Diagnosis: {
              id: "223e4567-e89b-12d3-a456-426614174000",
              code: "F41.1",
              description: "Generalized anxiety disorder",
            },
          },
        ],
        SurveyAnswers: null,
      };

      (prisma.diagnosisTreatmentPlan.findUnique as any)
        .mockResolvedValueOnce(mockExistingPlan)
        .mockResolvedValue(mockUpdatedPlan);

      const updateMock = vi.fn().mockResolvedValue({
        id: "323e4567-e89b-12d3-a456-426614174000",
        title: "Updated Plan",
      });

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return await callback({
          diagnosisTreatmentPlan: {
            update: updateMock,
            findUnique: vi.fn().mockResolvedValue(mockUpdatedPlan),
          },
          diagnosisTreatmentPlanItem: {
            deleteMany: vi.fn(),
            createMany: vi.fn(),
          },
          surveyAnswers: {
            create: vi.fn(),
            update: vi.fn(),
          },
        });
      });

      const requestBody = {
        id: "323e4567-e89b-12d3-a456-426614174000",
        title: "Updated Plan",
        diagnoses: [
          {
            id: "223e4567-e89b-12d3-a456-426614174000",
            code: "F41.1",
            description: "Generalized anxiety disorder",
          },
        ],
      };

      const request = createRequestWithBody(
        "/api/diagnosis-treatment-plan",
        requestBody,
        { method: "PUT" },
      );
      const response = await PUT(request);
      const data = await response.json();

      expect(updateMock).toHaveBeenCalledWith({
        where: { id: "323e4567-e89b-12d3-a456-426614174000" },
        data: {
          title: "Updated Plan",
          client_group_id: null,
          survey_answers_id: null,
          updated_at: expect.any(Date),
        },
      });

      expect(data).toEqual(mockUpdatedPlan);
      expect(response.status).toBe(200);
    });

    it("should return 400 when plan ID is missing", async () => {
      const request = createRequestWithBody(
        "/api/diagnosis-treatment-plan",
        {
          title: "Missing ID",
        },
        { method: "PUT" },
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(data.error).toBe("Treatment plan ID is required");
      expect(response.status).toBe(400);
    });

    it("should update survey answers when provided", async () => {
      const mockExistingPlan = {
        id: "323e4567-e89b-12d3-a456-426614174000",
        survey_answers_id: "423e4567-e89b-12d3-a456-426614174000",
        SurveyAnswers: { id: "423e4567-e89b-12d3-a456-426614174000" },
      };

      (prisma.diagnosisTreatmentPlan.findUnique as any).mockResolvedValue(
        mockExistingPlan,
      );

      const updateSurveyMock = vi.fn().mockResolvedValue({
        id: "423e4567-e89b-12d3-a456-426614174000",
        content: '{"q1":"answer1"}',
      });

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return await callback({
          surveyAnswers: {
            update: updateSurveyMock,
          },
          diagnosisTreatmentPlan: {
            update: vi.fn().mockResolvedValue({
              id: "323e4567-e89b-12d3-a456-426614174000",
              title: "Updated Plan",
            }),
            findUnique: vi.fn().mockResolvedValue({
              ...mockExistingPlan,
              title: "Updated Plan",
              SurveyAnswers: {
                id: "423e4567-e89b-12d3-a456-426614174000",
                content: '{"q1":"answer1"}',
              },
            }),
          },
          diagnosisTreatmentPlanItem: {
            deleteMany: vi.fn(),
            createMany: vi.fn(),
          },
        });
      });

      const requestBody = {
        id: "323e4567-e89b-12d3-a456-426614174000",
        title: "Updated Plan",
        diagnoses: [],
        surveyData: {
          templateId: "123e4567-e89b-12d3-a456-426614174000",
          content: { q1: "answer1" },
        },
      };

      const request = createRequestWithBody(
        "/api/diagnosis-treatment-plan",
        requestBody,
        { method: "PUT" },
      );
      const response = await PUT(request);

      expect(updateSurveyMock).toHaveBeenCalledWith({
        where: { id: "423e4567-e89b-12d3-a456-426614174000" },
        data: {
          content: '{"q1":"answer1"}',
          status: "COMPLETED",
          completed_at: expect.any(Date),
        },
      });

      expect(response.status).toBe(200);
    });
  });

  describe("DELETE", () => {
    it("should delete a treatment plan and its items", async () => {
      const mockPlan = {
        id: "623e4567-e89b-12d3-a456-426614174000",
        survey_answers_id: null,
        client_id: "123e4567-e89b-12d3-a456-426614174001",
        title: "Plan to delete",
      };

      (prisma.diagnosisTreatmentPlan.findUnique as any).mockResolvedValue(
        mockPlan,
      );
      (prisma.diagnosisTreatmentPlan.count as any).mockResolvedValue(0);
      (prisma.appointmentNotes.count as any).mockResolvedValue(0);
      (prisma.clientFiles.count as any).mockResolvedValue(0);

      const deleteItemsMock = vi.fn();
      const updatePlanMock = vi.fn();
      const deletePlanMock = vi.fn();

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return await callback({
          diagnosisTreatmentPlanItem: {
            deleteMany: deleteItemsMock,
          },
          diagnosisTreatmentPlan: {
            update: updatePlanMock,
            delete: deletePlanMock,
            count: vi.fn().mockResolvedValue(0),
          },
          appointmentNotes: {
            count: vi.fn().mockResolvedValue(0),
          },
          clientFiles: {
            count: vi.fn().mockResolvedValue(0),
          },
          surveyAnswers: {
            delete: vi.fn(),
          },
        });
      });

      const request = createRequest(
        "/api/diagnosis-treatment-plan?id=623e4567-e89b-12d3-a456-426614174000",
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(deleteItemsMock).toHaveBeenCalledWith({
        where: { treatment_plan_id: "623e4567-e89b-12d3-a456-426614174000" },
      });

      expect(deletePlanMock).toHaveBeenCalledWith({
        where: { id: "623e4567-e89b-12d3-a456-426614174000" },
      });

      expect(data.message).toBe("Treatment plan deleted successfully");
      expect(response.status).toBe(200);
    });

    it("should return 400 when plan ID is missing", async () => {
      const request = createRequest("/api/diagnosis-treatment-plan");

      const response = await DELETE(request);
      const data = await response.json();

      expect(data.error).toBe("Treatment plan ID is required");
      expect(response.status).toBe(400);
    });

    it("should return 404 when plan not found", async () => {
      (prisma.diagnosisTreatmentPlan.findUnique as any).mockResolvedValue(null);

      const request = createRequest(
        "/api/diagnosis-treatment-plan?id=non-existent",
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(data.error).toBe("Treatment plan not found");
      expect(response.status).toBe(404);
    });

    it("should preserve survey answers when referenced elsewhere", async () => {
      const mockPlan = {
        id: "723e4567-e89b-12d3-a456-426614174000",
        survey_answers_id: "823e4567-e89b-12d3-a456-426614174000",
        client_id: "123e4567-e89b-12d3-a456-426614174001",
        title: "Plan with shared survey",
      };

      (prisma.diagnosisTreatmentPlan.findUnique as any).mockResolvedValue(
        mockPlan,
      );

      const deleteSurveyMock = vi.fn();

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return await callback({
          diagnosisTreatmentPlanItem: {
            deleteMany: vi.fn(),
          },
          diagnosisTreatmentPlan: {
            count: vi.fn().mockResolvedValue(1), // Another plan uses this survey
            update: vi.fn(),
            delete: vi.fn(),
          },
          appointmentNotes: {
            count: vi.fn().mockResolvedValue(0),
          },
          clientFiles: {
            count: vi.fn().mockResolvedValue(0),
          },
          surveyAnswers: {
            delete: deleteSurveyMock,
          },
        });
      });

      const request = createRequest(
        "/api/diagnosis-treatment-plan?id=723e4567-e89b-12d3-a456-426614174000",
      );

      const response = await DELETE(request);

      // Survey should not be deleted since it's referenced elsewhere
      expect(deleteSurveyMock).not.toHaveBeenCalled();
      expect(response.status).toBe(200);
    });
  });
});
