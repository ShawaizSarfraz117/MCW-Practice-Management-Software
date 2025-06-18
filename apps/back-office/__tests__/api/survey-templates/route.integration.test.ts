/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-lines-per-function */
/* eslint-disable max-lines */
import { beforeEach, describe, expect, it, afterEach, vi } from "vitest";
import { GET } from "@/api/survey-templates/route";
import { prisma } from "@mcw/database";
import { createRequest } from "@mcw/utils";
import { Client, Appointment, Clinician, User } from "@mcw/database";

// Mock authentication helper
vi.mock("@/utils/helpers", () => ({
  getClinicianInfo: vi.fn().mockResolvedValue({
    isClinician: true,
    clinicianId: "test-clinician-id",
  }),
}));

describe("Survey Templates API Routes - Integration", () => {
  let testClient: Client;
  let testClinician: Clinician;
  let testAppointment: Appointment;
  let testUser: User;

  beforeEach(async () => {
    // Clean up before each test
    await prisma.surveyAnswers.deleteMany({});
    await prisma.appointment.deleteMany({});
    await prisma.surveyTemplate.deleteMany({});
    await prisma.clinician.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.client.deleteMany({});

    // Create test data
    testClient = await prisma.client.create({
      data: {
        legal_first_name: "John",
        legal_last_name: "Doe",
      },
    });

    // Create test user first
    testUser = await prisma.user.create({
      data: {
        email: "test@example.com",
        password_hash: "hashed_password",
      },
    });

    testClinician = await prisma.clinician.create({
      data: {
        first_name: "Dr.",
        last_name: "Smith",
        address: "123 Main St",
        percentage_split: 100,
        user_id: testUser.id,
      },
    });

    testAppointment = await prisma.appointment.create({
      data: {
        clinician_id: testClinician.id,
        start_date: new Date("2025-01-20T10:00:00"),
        end_date: new Date("2025-01-20T11:00:00"),
        type: "APPOINTMENT",
        status: "SHOW",
        created_by: testUser.id,
      },
    });
  });

  afterEach(async () => {
    // Clean up after each test
    await prisma.surveyAnswers.deleteMany({});
    await prisma.appointment.deleteMany({});
    await prisma.surveyTemplate.deleteMany({});
    await prisma.clinician.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.client.deleteMany({});
  });

  describe("GET", () => {
    it("should retrieve all active survey templates", async () => {
      // Create test templates
      await prisma.surveyTemplate.createMany({
        data: [
          {
            name: "Diagnosis Template 1",
            type: "DIAGNOSIS_AND_TREATMENT_PLANS",
            content: JSON.stringify({
              sections: [
                {
                  title: "Diagnosis Section",
                  questions: [
                    { id: "d1", text: "Diagnosis question", type: "text" },
                  ],
                },
              ],
            }),
            is_active: true,
            updated_at: new Date(),
          },
          {
            name: "Assessment Template",
            type: "ASSESSMENT",
            content: JSON.stringify({
              sections: [
                {
                  title: "Assessment Section",
                  questions: [
                    { id: "a1", text: "Assessment question", type: "text" },
                  ],
                },
              ],
            }),
            is_active: true,
            updated_at: new Date(),
          },
          {
            name: "Inactive Template",
            type: "ASSESSMENT",
            content: JSON.stringify({ sections: [] }),
            is_active: false,
            updated_at: new Date(),
          },
        ],
      });

      const request = createRequest("/api/survey-templates");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(3);
      expect(data.data[0].name).toContain("Template"); // Most recent first
      expect(data.pagination.total).toBe(3);
    });

    it("should filter templates by type", async () => {
      // Create templates of different types
      await prisma.surveyTemplate.createMany({
        data: [
          {
            name: "Diagnosis Template",
            type: "DIAGNOSIS_AND_TREATMENT_PLANS",
            content: JSON.stringify({ sections: [] }),
            is_active: true,
            updated_at: new Date(),
          },
          {
            name: "Assessment Template 1",
            type: "ASSESSMENT",
            content: JSON.stringify({ sections: [] }),
            is_active: true,
            updated_at: new Date(),
          },
          {
            name: "Assessment Template 2",
            type: "ASSESSMENT",
            content: JSON.stringify({ sections: [] }),
            is_active: true,
            updated_at: new Date(),
          },
        ],
      });

      const request = createRequest("/api/survey-templates?type=ASSESSMENT");

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(2);
      expect(data.data.every((t: any) => t.type === "ASSESSMENT")).toBe(true);
    });

    it("should filter templates by active status", async () => {
      await prisma.surveyTemplate.createMany({
        data: [
          {
            name: "Active Template",
            type: "ASSESSMENT",
            content: JSON.stringify({ sections: [] }),
            is_active: true,
            updated_at: new Date(),
          },
          {
            name: "Inactive Template 1",
            type: "ASSESSMENT",
            content: JSON.stringify({ sections: [] }),
            is_active: false,
            updated_at: new Date(),
          },
          {
            name: "Inactive Template 2",
            type: "DIAGNOSIS_AND_TREATMENT_PLANS",
            content: JSON.stringify({ sections: [] }),
            is_active: false,
            updated_at: new Date(),
          },
        ],
      });

      const request = createRequest("/api/survey-templates?is_active=false");

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(2);
      expect(data.data.every((t: any) => t.is_active === false)).toBe(true);
    });

    it("should include survey answers when requested", async () => {
      const template = await prisma.surveyTemplate.create({
        data: {
          name: "Template with Answers",
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
                    type: "radio",
                    options: ["Yes", "No"],
                  },
                ],
              },
            ],
          }),
          is_active: true,
          updated_at: new Date(),
        },
      });

      // Create survey answers
      await prisma.surveyAnswers.createMany({
        data: [
          {
            template_id: template.id,
            client_id: testClient.id,
            appointment_id: testAppointment.id,
            content: JSON.stringify({
              q1: "Answer to question 1",
              q2: "Yes",
            }),
            status: "COMPLETED",
            assigned_at: new Date(),
            completed_at: new Date(),
          },
          {
            template_id: template.id,
            client_id: testClient.id,
            content: JSON.stringify({
              q1: "Another answer",
              q2: "No",
            }),
            status: "IN_PROGRESS",
            assigned_at: new Date(),
          },
        ],
      });

      const request = createRequest(
        "/api/survey-templates?include_answers=true",
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].SurveyAnswers).toHaveLength(2);

      // Find the completed survey answer (order is not guaranteed)
      const completedAnswer = data.data[0].SurveyAnswers.find(
        (answer: any) => answer.status === "COMPLETED",
      );
      const inProgressAnswer = data.data[0].SurveyAnswers.find(
        (answer: any) => answer.status === "IN_PROGRESS",
      );

      expect(completedAnswer).toBeTruthy();
      expect(completedAnswer.content.q1).toBe("Answer to question 1");
      expect(completedAnswer.content.q2).toBe("Yes");
      expect(completedAnswer.Client.legal_first_name).toBe("John");
      expect(completedAnswer.Appointment).toBeTruthy();

      expect(inProgressAnswer).toBeTruthy();
      expect(inProgressAnswer.content.q1).toBe("Another answer");
      expect(inProgressAnswer.content.q2).toBe("No");
    });

    it("should filter survey answers by client ID", async () => {
      const template = await prisma.surveyTemplate.create({
        data: {
          name: "Multi-client Template",
          type: "ASSESSMENT",
          content: JSON.stringify({ sections: [] }),
          is_active: true,
          updated_at: new Date(),
        },
      });

      // Create another client
      const otherClient = await prisma.client.create({
        data: {
          legal_first_name: "Jane",
          legal_last_name: "Smith",
        },
      });

      // Create survey answers for both clients
      await prisma.surveyAnswers.createMany({
        data: [
          {
            template_id: template.id,
            client_id: testClient.id,
            content: JSON.stringify({ response: "John's answer" }),
            status: "COMPLETED",
            assigned_at: new Date(),
          },
          {
            template_id: template.id,
            client_id: otherClient.id,
            content: JSON.stringify({ response: "Jane's answer" }),
            status: "COMPLETED",
            assigned_at: new Date(),
          },
        ],
      });

      const request = createRequest(
        `/api/survey-templates?client_id=${testClient.id}&include_answers=true`,
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data[0].SurveyAnswers).toHaveLength(1);
      expect(data.data[0].SurveyAnswers[0].client_id).toBe(testClient.id);
      expect(data.data[0].SurveyAnswers[0].content.response).toBe(
        "John's answer",
      );
    });

    it("should handle pagination correctly", async () => {
      // Create many templates
      const templates = [];
      for (let i = 1; i <= 25; i++) {
        templates.push({
          name: `Template ${i}`,
          type: "ASSESSMENT",
          content: JSON.stringify({ sections: [] }),
          is_active: true,
          updated_at: new Date(),
        });
      }
      await prisma.surveyTemplate.createMany({ data: templates });

      // Get page 2 with limit 10
      const request = createRequest("/api/survey-templates?page=2&limit=10");

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(10);
      expect(data.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
    });

    it("should exclude survey answers when requested", async () => {
      const template = await prisma.surveyTemplate.create({
        data: {
          name: "Template",
          type: "ASSESSMENT",
          content: JSON.stringify({ sections: [] }),
          is_active: true,
          updated_at: new Date(),
        },
      });

      await prisma.surveyAnswers.create({
        data: {
          template_id: template.id,
          client_id: testClient.id,
          content: JSON.stringify({ data: "answer" }),
          status: "COMPLETED",
          assigned_at: new Date(),
        },
      });

      const request = createRequest(
        "/api/survey-templates?include_answers=false",
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data[0].SurveyAnswers).toBeUndefined();
    });

    it("should parse complex JSON content correctly", async () => {
      const complexContent = {
        sections: [
          {
            title: "Demographics",
            questions: [
              { id: "name", text: "Full Name", type: "text", required: true },
              {
                id: "age_group",
                text: "Age Group",
                type: "select",
                options: ["18-25", "26-35", "36-45", "46+"],
              },
            ],
          },
          {
            title: "Medical History",
            questions: [
              {
                id: "conditions",
                text: "Current Conditions",
                type: "checkbox",
                options: ["Diabetes", "Hypertension", "Asthma", "None"],
              },
              {
                id: "medications",
                text: "Current Medications",
                type: "textarea",
              },
            ],
          },
        ],
        metadata: {
          version: "1.0",
          created_by: "System",
        },
      };

      await prisma.surveyTemplate.create({
        data: {
          name: "Complex Template",
          type: "ASSESSMENT",
          content: JSON.stringify(complexContent),
          is_active: true,
          updated_at: new Date(),
        },
      });

      const request = createRequest("/api/survey-templates");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data[0].content).toEqual(complexContent);
      expect(data.data[0].content.sections).toHaveLength(2);
      expect(data.data[0].content.sections[0].questions).toHaveLength(2);
      expect(data.data[0].content.metadata.version).toBe("1.0");
    });

    it("should return empty array when no templates exist", async () => {
      const request = createRequest("/api/survey-templates");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual([]);
      expect(data.pagination.total).toBe(0);
    });

    it("should order templates by creation date descending", async () => {
      await prisma.surveyTemplate.create({
        data: {
          name: "Old Template",
          type: "ASSESSMENT",
          content: JSON.stringify({ sections: [] }),
          is_active: true,
          created_at: new Date("2025-01-01"),
          updated_at: new Date("2025-01-01"),
        },
      });

      await prisma.surveyTemplate.create({
        data: {
          name: "New Template",
          type: "ASSESSMENT",
          content: JSON.stringify({ sections: [] }),
          is_active: true,
          created_at: new Date("2025-01-15"),
          updated_at: new Date("2025-01-15"),
        },
      });

      await prisma.surveyTemplate.create({
        data: {
          name: "Middle Template",
          type: "ASSESSMENT",
          content: JSON.stringify({ sections: [] }),
          is_active: true,
          created_at: new Date("2025-01-10"),
          updated_at: new Date("2025-01-10"),
        },
      });

      const request = createRequest("/api/survey-templates");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(3);
      expect(data.data[0].name).toBe("New Template");
      expect(data.data[1].name).toBe("Middle Template");
      expect(data.data[2].name).toBe("Old Template");
    });
  });
});
