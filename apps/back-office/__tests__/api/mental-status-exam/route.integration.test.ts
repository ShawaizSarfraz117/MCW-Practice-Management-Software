import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  afterAll,
  vi,
} from "vitest";
import { prisma } from "@mcw/database";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import {
  GET,
  POST,
  DELETE,
} from "../../../src/app/api/mental-status-exam/route";

// Mock helper functions
vi.mock("@/utils/helpers", () => ({
  getClinicianInfo: vi.fn(() =>
    Promise.resolve({
      isClinician: true,
      clinicianId: "test-clinician-id",
      clinician: {
        id: "test-clinician-id",
        first_name: "Test",
        last_name: "Clinician",
      },
    }),
  ),
}));

// Mock logger
vi.mock("@mcw/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  getDbLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

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

describe("Mental Status Exam API Integration Tests", () => {
  let createdTemplateIds: string[] = [];

  beforeEach(() => {
    createdTemplateIds = [];
  });

  afterEach(async () => {
    // Clean up created records
    if (createdTemplateIds.length > 0) {
      await prisma.surveyTemplate.deleteMany({
        where: { id: { in: createdTemplateIds } },
      });
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("POST /api/mental-status-exam (Create Template Only)", () => {
    it("should create a mental status exam template with valid data", async () => {
      const requestBody = {
        name: "Integration Test Mental Status Exam",
        description: "Test description for integration",
        content: validMentalStatusContent,
      };

      const request = createRequestWithBody(
        "/api/mental-status-exam",
        requestBody,
      );
      const response = await POST(request);

      expect(response.status).toBe(201);

      const responseData = await response.json();
      expect(responseData.template).toBeDefined();
      expect(responseData.template.name).toBe(
        "Integration Test Mental Status Exam",
      );
      expect(responseData.template.description).toBe(
        "Test description for integration",
      );
      expect(responseData.template.type).toBe("MENTAL_STATUS_EXAM");
      expect(responseData.template.content).toEqual(validMentalStatusContent);
      expect(responseData.template.is_active).toBe(true);
      expect(responseData.message).toBe(
        "Mental Status Exam template created successfully",
      );
      expect(responseData.survey_answer).toBeUndefined();

      // Track for cleanup
      createdTemplateIds.push(responseData.template.id);

      // Verify in database
      const dbTemplate = await prisma.surveyTemplate.findUnique({
        where: { id: responseData.template.id },
      });
      expect(dbTemplate).toBeTruthy();
      expect(dbTemplate?.name).toBe("Integration Test Mental Status Exam");
      expect(dbTemplate?.type).toBe("MENTAL_STATUS_EXAM");
    });

    it("should return 400 for missing required fields", async () => {
      const requestBody = {
        description: "Missing name field",
        content: validMentalStatusContent,
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
        name: "Test Template",
        content: {
          appearance: "Normal",
          // Missing required fields
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
  });

  describe("GET /api/mental-status-exam (Integration)", () => {
    it("should retrieve template by ID", async () => {
      // Create a template first
      const createPayload = {
        name: "Get Test Template",
        content: validMentalStatusContent,
      };

      const createRequestObj = createRequestWithBody(
        "/api/mental-status-exam",
        createPayload,
      );
      const createResponse = await POST(createRequestObj);
      expect(createResponse.status).toBe(201);
      const createJson = await createResponse.json();

      createdTemplateIds.push(createJson.template.id);

      // Now retrieve the template
      const getRequestObj = createRequest(
        `/api/mental-status-exam?id=${createJson.template.id}`,
      );
      const getResponse = await GET(getRequestObj);

      expect(getResponse.status).toBe(200);
      const getJson = await getResponse.json();

      expect(getJson).toMatchObject({
        id: createJson.template.id,
        name: "Get Test Template",
        type: "MENTAL_STATUS_EXAM",
        content: validMentalStatusContent,
        SurveyAnswers: expect.any(Array),
      });
    });

    it("should return 400 when ID parameter is missing", async () => {
      const getRequestObj = createRequest("/api/mental-status-exam");
      const getResponse = await GET(getRequestObj);

      expect(getResponse.status).toBe(400);
      const getJson = await getResponse.json();
      expect(getJson.error).toBe("Template ID is required");
    });
  });

  describe("DELETE /api/mental-status-exam (Integration)", () => {
    it("should delete template and verify it's removed from database", async () => {
      // Create a template first
      const createPayload = {
        name: "Delete Test Template",
        content: validMentalStatusContent,
      };

      const createRequestObj = createRequestWithBody(
        "/api/mental-status-exam",
        createPayload,
      );
      const createResponse = await POST(createRequestObj);
      expect(createResponse.status).toBe(201);
      const createJson = await createResponse.json();

      const templateId = createJson.template.id;

      // Now delete the template
      const deleteRequestObj = createRequest(
        `/api/mental-status-exam?id=${templateId}`,
        { method: "DELETE" },
      );
      const deleteResponse = await DELETE(deleteRequestObj);

      expect(deleteResponse.status).toBe(200);
      const deleteJson = await deleteResponse.json();

      expect(deleteJson.message).toBe(
        "Template and associated survey answers deleted successfully",
      );
      expect(deleteJson.template.id).toBe(templateId);
      expect(deleteJson.template.name).toBe("Delete Test Template");

      // Verify template is actually deleted from database
      const deletedTemplate = await prisma.surveyTemplate.findUnique({
        where: { id: templateId },
      });
      expect(deletedTemplate).toBeNull();
    });

    it("should return 400 when ID parameter is missing for deletion", async () => {
      const deleteRequestObj = createRequest("/api/mental-status-exam", {
        method: "DELETE",
      });
      const deleteResponse = await DELETE(deleteRequestObj);

      expect(deleteResponse.status).toBe(400);
      const deleteJson = await deleteResponse.json();
      expect(deleteJson.error).toBe("Template ID is required");
    });
  });
});
