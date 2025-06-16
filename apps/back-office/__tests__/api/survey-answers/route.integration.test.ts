/* eslint-disable max-lines-per-function */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { POST, GET } from "@/api/survey-answers/route";
import { prisma } from "@mcw/database";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { randomUUID } from "crypto";

// Mock the authentication
vi.mock("@/utils/helpers", () => ({
  getClinicianInfo: vi.fn().mockResolvedValue({
    isClinician: true,
    clinicianId: "test-clinician-id",
  }),
}));

// Mock the scoring utilities
vi.mock("@mcw/utils", async () => {
  const actual = await vi.importActual("@mcw/utils");
  return {
    ...actual,
    calculateSurveyScore: vi.fn(
      (surveyType: string, content: Record<string, unknown>) => {
        // Simple scoring logic for testing
        if (surveyType === "GAD-7") {
          return {
            totalScore: 10,
            severity: "Mild",
            interpretation: "Mild anxiety symptoms",
            flaggedItems: [],
          };
        }
        if (surveyType === "PHQ-9") {
          // Check for suicidal ideation (question 9)
          const hasItem4 = Object.values(content).some(
            (val) => val === "Item 4",
          );
          return {
            totalScore: 12,
            severity: "Moderate",
            interpretation: "Moderate depression symptoms",
            flaggedItems: hasItem4
              ? [
                  "Suicidal ideation reported - immediate clinical attention required",
                ]
              : [],
          };
        }
        if (surveyType === "ARM-5") {
          return {
            totalScore: 8,
            severity: "Low",
            interpretation: "Low alliance rupture",
            flaggedItems: [],
          };
        }
        return null;
      },
    ),
    getSurveyType: vi.fn((templateName: string) => {
      if (templateName.toLowerCase().includes("gad-7")) return "GAD-7";
      if (templateName.toLowerCase().includes("phq-9")) return "PHQ-9";
      if (templateName.toLowerCase().includes("arm-5")) return "ARM-5";
      return null;
    }),
  };
});

// Types for test data
interface SurveyAnswerResponse {
  id: string;
  template_id: string;
  client_id: string;
  client_group_id?: string;
  appointment_id?: string;
  content?: Record<string, unknown>;
  score?: {
    totalScore: number;
    severity?: string;
    interpretation?: string;
    flaggedItems?: string[];
  } | null;
  status: string;
  assigned_at: string;
  completed_at?: string;
  Appointment?: {
    id: string;
  };
  SurveyTemplate: {
    id: string;
    name: string;
    type: string;
    description: string;
  };
  Client?: {
    id: string;
  };
}

// Removed unused PaginatedResponse interface

// Helper functions are now imported from @mcw/utils

describe("Survey Answers API - Integration Tests", () => {
  let testClinicianId: string;
  let testClientId: string;
  let testClientGroupId: string;
  let testTemplateId: string;
  let testAppointmentId: string;
  let testSurveyAnswerId: string;

  beforeAll(async () => {
    // Create test user
    const testUser = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: `test-survey-${Date.now()}@example.com`,
        password_hash: "hashed_password",
      },
    });

    // Create test clinician
    const testClinician = await prisma.clinician.create({
      data: {
        id: randomUUID(),
        user_id: testUser.id,
        first_name: "Test",
        last_name: "Clinician",
        address: "123 Test Street",
        percentage_split: 70,
        is_active: true,
      },
    });
    testClinicianId = testClinician.id;

    // Create test location
    const testLocation = await prisma.location.create({
      data: {
        id: randomUUID(),
        name: "Test Location",
        address: "456 Test Avenue",
      },
    });

    // Create test client group
    const testClientGroup = await prisma.clientGroup.create({
      data: {
        id: randomUUID(),
        name: "Test Client Group",
        type: "individual",
        clinician_id: testClinicianId,
      },
    });
    testClientGroupId = testClientGroup.id;

    // Create test client
    const testClient = await prisma.client.create({
      data: {
        id: randomUUID(),
        legal_first_name: "Test",
        legal_last_name: "Client",
        preferred_name: "Test",
        is_active: true,
        is_waitlist: false,
      },
    });
    testClientId = testClient.id;

    // Create client group membership
    await prisma.clientGroupMembership.create({
      data: {
        client_id: testClientId,
        client_group_id: testClientGroupId,
        is_contact_only: false,
        is_responsible_for_billing: true,
        created_at: new Date(),
      },
    });

    // Create test service
    const testService = await prisma.practiceService.create({
      data: {
        id: randomUUID(),
        type: "Individual Therapy",
        rate: 150.0,
        code: "90834",
        duration: 50,
        allow_new_clients: true,
        available_online: true,
        bill_in_units: false,
        block_after: 0,
        block_before: 0,
        require_call: false,
        is_default: false,
      },
    });

    // Create test appointment
    const testAppointment = await prisma.appointment.create({
      data: {
        id: randomUUID(),
        client_group_id: testClientGroupId,
        clinician_id: testClinicianId,
        location_id: testLocation.id,
        service_id: testService.id,
        start_date: new Date(),
        end_date: new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
        status: "SHOW",
        type: "APPOINTMENT",
        title: "Test Appointment",
        appointment_fee: 150.0,
        created_by: testUser.id,
      },
    });
    testAppointmentId = testAppointment.id;

    // Create test survey template
    const testTemplate = await prisma.surveyTemplate.create({
      data: {
        id: randomUUID(),
        name: "GAD-7",
        type: "ASSESSMENT",
        description: "Generalized Anxiety Disorder 7-item scale",
        content: JSON.stringify({
          title: "GAD-7",
          pages: [
            {
              elements: [
                {
                  type: "radiogroup",
                  name: "gad7_q1",
                  title: "Feeling nervous, anxious or on edge",
                  choices: [
                    "Not at all",
                    "Several days",
                    "Over half the days",
                    "Nearly every day",
                  ],
                },
              ],
            },
          ],
        }),
        is_active: true,
        updated_at: new Date(),
        is_default: false,
        requires_signature: false,
        is_shareable: false,
      },
    });
    testTemplateId = testTemplate.id;
  });

  afterAll(async () => {
    // Clean up test data
    try {
      if (testSurveyAnswerId) {
        await prisma.surveyAnswers.delete({
          where: { id: testSurveyAnswerId },
        });
      }
      if (testTemplateId) {
        await prisma.surveyTemplate.delete({ where: { id: testTemplateId } });
      }
      if (testAppointmentId) {
        await prisma.appointment.delete({ where: { id: testAppointmentId } });
      }
      await prisma.clientGroupMembership.deleteMany({
        where: { client_id: testClientId },
      });
      if (testClientId) {
        await prisma.client.delete({ where: { id: testClientId } });
      }
      if (testClientGroupId) {
        await prisma.clientGroup.delete({ where: { id: testClientGroupId } });
      }
      if (testClinicianId) {
        const clinician = await prisma.clinician.findUnique({
          where: { id: testClinicianId },
          select: { user_id: true },
        });
        await prisma.clinician.delete({ where: { id: testClinicianId } });
        if (clinician?.user_id) {
          await prisma.user.delete({ where: { id: clinician.user_id } });
        }
      }
      // Clean up other test data (location, service)
      await prisma.location.deleteMany({ where: { name: "Test Location" } });
      await prisma.practiceService.deleteMany({
        where: { type: "Individual Therapy" },
      });
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  });

  describe("POST /api/survey-answers", () => {
    it("should create a new survey answer with real database", async () => {
      // Arrange
      const requestData = {
        template_id: testTemplateId,
        client_id: testClientId,
        content: {
          gad7_q1: "Item 2", // Several days
          gad7_q2: "Item 3", // Over half the days
          gad7_q3: "Item 1", // Not at all
          gad7_q4: "Item 1", // Not at all
          gad7_q5: "Item 1", // Not at all
          gad7_q6: "Item 1", // Not at all
          gad7_q7: "Item 1", // Not at all
          gad7_q8: "Item 1", // Not at all (difficulty question)
        },
        status: "COMPLETED",
      };

      // Act
      const request = createRequestWithBody("/api/survey-answers", requestData);
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(201);
      const responseData = await response.json();
      expect(responseData.template_id).toBe(testTemplateId);
      expect(responseData.client_id).toBe(testClientId);
      expect(responseData.status).toBe("COMPLETED");
      expect(responseData.score).toBeDefined();
      expect(responseData.score.totalScore).toBe(10);
      expect(responseData.score.severity).toBe("Mild");

      // Store ID for cleanup
      testSurveyAnswerId = responseData.id;

      // Verify in database
      const savedSurvey = await prisma.surveyAnswers.findUnique({
        where: { id: testSurveyAnswerId },
      });
      expect(savedSurvey).toBeTruthy();
      expect(savedSurvey?.status).toBe("COMPLETED");
      expect(savedSurvey?.completed_at).toBeTruthy();
    });

    it("should create survey answer using client_group_id", async () => {
      // Arrange
      const requestData = {
        template_id: testTemplateId,
        client_group_id: testClientGroupId,
        content: {
          gad7_q1: "Item 1", // Not at all
          gad7_q2: "Item 1", // Not at all
        },
        status: "IN_PROGRESS",
      };

      // Act
      const request = createRequestWithBody("/api/survey-answers", requestData);
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(201);
      const responseData = await response.json();
      expect(responseData.client_id).toBe(testClientId); // Should find primary client
      expect(responseData.client_group_id).toBe(testClientGroupId);
      expect(responseData.status).toBe("IN_PROGRESS");
      expect(responseData.score).toBeNull(); // No score for in-progress

      // Clean up
      await prisma.surveyAnswers.delete({ where: { id: responseData.id } });
    });

    it("should create survey answer with appointment reference", async () => {
      // Arrange
      const requestData = {
        template_id: testTemplateId,
        client_id: testClientId,
        appointment_id: testAppointmentId,
        content: {
          gad7_q1: "Item 2",
        },
        status: "PENDING",
      };

      // Act
      const request = createRequestWithBody("/api/survey-answers", requestData);
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(201);
      const responseData = await response.json();
      expect(responseData.appointment_id).toBe(testAppointmentId);
      expect(responseData.Appointment).toBeDefined();
      expect(responseData.Appointment.id).toBe(testAppointmentId);

      // Clean up
      await prisma.surveyAnswers.delete({ where: { id: responseData.id } });
    });

    it("should handle PHQ-9 with suicidal ideation flagging", async () => {
      // Create PHQ-9 template
      const phq9Template = await prisma.surveyTemplate.create({
        data: {
          id: randomUUID(),
          name: "PHQ-9",
          type: "ASSESSMENT",
          description: "Patient Health Questionnaire-9",
          content: JSON.stringify({ title: "PHQ-9" }),
          is_active: true,
          updated_at: new Date(),
          is_default: false,
          requires_signature: false,
          is_shareable: false,
        },
      });

      // Arrange
      const requestData = {
        template_id: phq9Template.id,
        client_id: testClientId,
        content: {
          phq9_q1: "Item 2", // Several days
          phq9_q2: "Item 2", // Several days
          phq9_q3: "Item 1", // Not at all
          phq9_q4: "Item 1", // Not at all
          phq9_q5: "Item 1", // Not at all
          phq9_q6: "Item 1", // Not at all
          phq9_q7: "Item 1", // Not at all
          phq9_q8: "Item 1", // Not at all
          phq9_q9: "Item 4", // Nearly every day (suicidal ideation)
          phq9_q10: "Item 2", // Somewhat difficult
        },
        status: "COMPLETED",
      };

      // Act
      const request = createRequestWithBody("/api/survey-answers", requestData);
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(201);
      const responseData = await response.json();
      expect(responseData.score).toBeDefined();
      expect(responseData.score.flaggedItems).toContain(
        "Suicidal ideation reported - immediate clinical attention required",
      );

      // Clean up
      await prisma.surveyAnswers.delete({ where: { id: responseData.id } });
      await prisma.surveyTemplate.delete({ where: { id: phq9Template.id } });
    });

    it("should handle ARM-5 survey creation", async () => {
      // Create ARM-5 template
      const arm5Template = await prisma.surveyTemplate.create({
        data: {
          id: randomUUID(),
          name: "ARM-5",
          type: "ASSESSMENT",
          description: "Alliance Rupture Measure - 5 items",
          content: JSON.stringify({ title: "ARM-5" }),
          is_active: true,
          updated_at: new Date(),
          is_default: false,
          requires_signature: false,
          is_shareable: false,
        },
      });

      // Arrange
      const requestData = {
        template_id: arm5Template.id,
        client_id: testClientId,
        content: {
          arm5_q1: "Item 3", // Slightly Disagree
          arm5_q2: "Item 4", // Neutral
          arm5_q3: "Item 5", // Slightly Agree
          arm5_q4: "Item 2", // Disagree
          arm5_q5: "Item 1", // Strongly Disagree
        },
        status: "COMPLETED",
      };

      // Act
      const request = createRequestWithBody("/api/survey-answers", requestData);
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(201);
      const responseData = await response.json();
      expect(responseData.score).toBeDefined();
      expect(responseData.score.totalScore).toBe(8);
      expect(responseData.score.interpretation).toBe("Low alliance rupture");

      // Clean up
      await prisma.surveyAnswers.delete({ where: { id: responseData.id } });
      await prisma.surveyTemplate.delete({ where: { id: arm5Template.id } });
    });
  });

  describe("GET /api/survey-answers", () => {
    it("should retrieve survey answers with real database", async () => {
      // Act
      const request = createRequest("/api/survey-answers");
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.data).toBeDefined();
      expect(Array.isArray(responseData.data)).toBe(true);
      expect(responseData.pagination).toBeDefined();
      expect(responseData.pagination.page).toBe(1);
      expect(responseData.pagination.limit).toBe(20);

      // Should include our test survey answer if it exists
      if (testSurveyAnswerId) {
        const foundAnswer = responseData.data.find(
          (answer: SurveyAnswerResponse) => answer.id === testSurveyAnswerId,
        );
        expect(foundAnswer).toBeDefined();
        expect(foundAnswer.SurveyTemplate).toBeDefined();
        expect(foundAnswer.Client).toBeDefined();
      }
    });

    it("should filter by client_id", async () => {
      // Act
      const request = createRequest(
        `/api/survey-answers?client_id=${testClientId}`,
      );
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.data).toBeDefined();

      // All returned answers should be for our test client
      responseData.data.forEach((answer: SurveyAnswerResponse) => {
        expect(answer.client_id).toBe(testClientId);
      });
    });

    it("should filter by client_group_id", async () => {
      // Act
      const request = createRequest(
        `/api/survey-answers?client_group_id=${testClientGroupId}`,
      );
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.data).toBeDefined();

      // All returned answers should be for our test client group
      responseData.data.forEach((answer: SurveyAnswerResponse) => {
        expect(answer.client_group_id).toBe(testClientGroupId);
      });
    });

    it("should filter by template_type", async () => {
      // Act
      const request = createRequest(
        "/api/survey-answers?template_type=ASSESSMENT",
      );
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.data).toBeDefined();

      // All returned answers should be for ASSESSMENT templates
      responseData.data.forEach((answer: SurveyAnswerResponse) => {
        expect(answer.SurveyTemplate.type).toBe("ASSESSMENT");
      });
    });

    it("should filter by status", async () => {
      // Act
      const request = createRequest("/api/survey-answers?status=COMPLETED");
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.data).toBeDefined();

      // All returned answers should have COMPLETED status
      responseData.data.forEach((answer: SurveyAnswerResponse) => {
        expect(answer.status).toBe("COMPLETED");
      });
    });

    it("should handle pagination", async () => {
      // Act
      const request = createRequest("/api/survey-answers?page=1&limit=5");
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.pagination.page).toBe(1);
      expect(responseData.pagination.limit).toBe(5);
      expect(responseData.data.length).toBeLessThanOrEqual(5);
    });
  });
});
