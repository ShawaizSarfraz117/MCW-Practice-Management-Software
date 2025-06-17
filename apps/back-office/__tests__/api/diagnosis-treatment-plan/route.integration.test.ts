/* eslint-disable max-lines-per-function */
/* eslint-disable max-lines */
import { beforeEach, describe, expect, it, afterEach } from "vitest";
import { GET, POST, PUT, DELETE } from "@/api/diagnosis-treatment-plan/route";
import { prisma } from "@mcw/database";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { Client, Diagnosis, ClientGroup, SurveyTemplate } from "@mcw/database";

describe("Diagnosis Treatment Plan API Routes - Integration", () => {
  let testClient: Client;
  let testClientGroup: ClientGroup;
  let testDiagnosis: Diagnosis;
  let testTemplate: SurveyTemplate;

  beforeEach(async () => {
    // Clean up before each test
    await prisma.diagnosisTreatmentPlanItem.deleteMany({});
    await prisma.diagnosisTreatmentPlan.deleteMany({});
    await prisma.clientGroupMembership.deleteMany({});
    await prisma.clientGroup.deleteMany({});
    await prisma.surveyAnswers.deleteMany({});
    await prisma.surveyTemplate.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.diagnosis.deleteMany({});

    // Create test data
    testClient = await prisma.client.create({
      data: {
        legal_first_name: "John",
        legal_last_name: "Doe",
      },
    });

    testClientGroup = await prisma.clientGroup.create({
      data: {
        id: "test-client-group-id",
        name: "Test Group",
        type: "individual",
      },
    });

    await prisma.clientGroupMembership.create({
      data: {
        client_id: testClient.id,
        client_group_id: testClientGroup.id,
      },
    });

    testDiagnosis = await prisma.diagnosis.create({
      data: {
        code: "F32.9",
        description: "Major depressive disorder, single episode, unspecified",
      },
    });

    testTemplate = await prisma.surveyTemplate.create({
      data: {
        name: "Test Template",
        type: "DIAGNOSIS_AND_TREATMENT_PLANS",
        content: JSON.stringify({
          sections: [
            {
              title: "Section 1",
              questions: [{ id: "q1", text: "Question 1", type: "text" }],
            },
          ],
        }),
        is_active: true,
        updated_at: new Date(),
      },
    });
  });

  afterEach(async () => {
    // Clean up after each test
    await prisma.diagnosisTreatmentPlanItem.deleteMany({});
    await prisma.diagnosisTreatmentPlan.deleteMany({});
    await prisma.clientGroupMembership.deleteMany({});
    await prisma.clientGroup.deleteMany({});
    await prisma.surveyAnswers.deleteMany({});
    await prisma.surveyTemplate.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.diagnosis.deleteMany({});
  });

  describe("GET", () => {
    it("should fetch all treatment plans for a client", async () => {
      // Create test treatment plans
      const plan1 = await prisma.diagnosisTreatmentPlan.create({
        data: {
          client_id: testClient.id,
          client_group_id: testClientGroup.id,
          title: "Treatment Plan 1",
        },
      });

      await prisma.diagnosisTreatmentPlan.create({
        data: {
          client_id: testClient.id,
          client_group_id: testClientGroup.id,
          title: "Treatment Plan 2",
        },
      });

      // Add diagnosis items
      await prisma.diagnosisTreatmentPlanItem.create({
        data: {
          treatment_plan_id: plan1.id,
          diagnosis_id: testDiagnosis.id,
        },
      });

      const request = createRequest(
        `/api/diagnosis-treatment-plan?clientId=${testClient.id}`,
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
      expect(data[0].title).toBe("Treatment Plan 2"); // Most recent first
      expect(data[1].title).toBe("Treatment Plan 1");
      expect(data[1].DiagnosisTreatmentPlanItem).toHaveLength(1);
      expect(data[1].DiagnosisTreatmentPlanItem[0].Diagnosis.code).toBe(
        "F32.9",
      );
    });

    it("should fetch a specific treatment plan by ID", async () => {
      const plan = await prisma.diagnosisTreatmentPlan.create({
        data: {
          client_id: testClient.id,
          title: "Specific Plan",
        },
      });

      await prisma.diagnosisTreatmentPlanItem.create({
        data: {
          treatment_plan_id: plan.id,
          diagnosis_id: testDiagnosis.id,
          custom_description: "Custom description",
        },
      });

      const request = createRequest(
        `/api/diagnosis-treatment-plan?planId=${plan.id}`,
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(plan.id);
      expect(data.title).toBe("Specific Plan");
      expect(data.DiagnosisTreatmentPlanItem).toHaveLength(1);
      expect(data.DiagnosisTreatmentPlanItem[0].custom_description).toBe(
        "Custom description",
      );
    });

    it("should return 404 for non-existent plan", async () => {
      const request = createRequest(
        "/api/diagnosis-treatment-plan?planId=non-existent-id",
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Treatment plan not found");
    });
  });

  describe("POST", () => {
    it("should create a new treatment plan with diagnoses", async () => {
      const requestBody = {
        clientId: testClient.id,
        clientGroupId: testClientGroup.id,
        title: "New Treatment Plan",
        diagnoses: [
          {
            id: testDiagnosis.id,
            code: testDiagnosis.code,
            description: testDiagnosis.description,
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

      expect(response.status).toBe(201);
      expect(data.title).toBe("New Treatment Plan");
      expect(data.client_id).toBe(testClient.id);
      expect(data.client_group_id).toBe(testClientGroup.id);
      expect(data.DiagnosisTreatmentPlanItem).toHaveLength(1);
      expect(data.DiagnosisTreatmentPlanItem[0].Diagnosis.code).toBe("F32.9");

      // Verify in database
      const planInDb = await prisma.diagnosisTreatmentPlan.findUnique({
        where: { id: data.id },
        include: { DiagnosisTreatmentPlanItem: true },
      });

      expect(planInDb).not.toBeNull();
      expect(planInDb?.DiagnosisTreatmentPlanItem).toHaveLength(1);
    });

    it("should create treatment plan with survey answer", async () => {
      const surveyAnswer = await prisma.surveyAnswers.create({
        data: {
          template_id: testTemplate.id,
          client_id: testClient.id,
          content: JSON.stringify({ q1: "Answer 1" }),
          status: "COMPLETED",
          assigned_at: new Date(),
          completed_at: new Date(),
        },
      });

      const requestBody = {
        clientId: testClient.id,
        title: "Plan with Survey",
        diagnoses: [],
        surveyAnswersId: surveyAnswer.id,
      };

      const request = createRequestWithBody(
        "/api/diagnosis-treatment-plan",
        requestBody,
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.survey_answers_id).toBe(surveyAnswer.id);
      expect(data.SurveyAnswers).not.toBeNull();
    });

    it("should return 404 when client doesn't exist", async () => {
      const requestBody = {
        clientId: "non-existent-client",
        title: "Test Plan",
        diagnoses: [],
      };

      const request = createRequestWithBody(
        "/api/diagnosis-treatment-plan",
        requestBody,
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain("Client not found");
    });
  });

  describe("PUT", () => {
    it("should update an existing treatment plan", async () => {
      const plan = await prisma.diagnosisTreatmentPlan.create({
        data: {
          client_id: testClient.id,
          title: "Original Title",
        },
      });

      // Create a second diagnosis for updating
      const diagnosis2 = await prisma.diagnosis.create({
        data: {
          code: "F41.1",
          description: "Generalized anxiety disorder",
        },
      });

      const requestBody = {
        id: plan.id,
        title: "Updated Title",
        diagnoses: [
          {
            id: diagnosis2.id,
            code: diagnosis2.code,
            description: diagnosis2.description,
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

      expect(response.status).toBe(200);
      expect(data.title).toBe("Updated Title");
      expect(data.DiagnosisTreatmentPlanItem).toHaveLength(1);
      expect(data.DiagnosisTreatmentPlanItem[0].Diagnosis.code).toBe("F41.1");
    });

    it("should update survey answers when provided", async () => {
      const surveyAnswer = await prisma.surveyAnswers.create({
        data: {
          template_id: testTemplate.id,
          client_id: testClient.id,
          content: JSON.stringify({ q1: "Original answer" }),
          status: "IN_PROGRESS",
          assigned_at: new Date(),
        },
      });

      const plan = await prisma.diagnosisTreatmentPlan.create({
        data: {
          client_id: testClient.id,
          title: "Plan with Survey",
          survey_answers_id: surveyAnswer.id,
        },
      });

      const requestBody = {
        id: plan.id,
        title: "Updated Plan",
        diagnoses: [],
        surveyData: {
          templateId: testTemplate.id,
          content: { q1: "Updated answer" },
        },
      };

      const request = createRequestWithBody(
        "/api/diagnosis-treatment-plan",
        requestBody,
        { method: "PUT" },
      );
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.SurveyAnswers).not.toBeNull();

      // Check survey answer was updated
      const updatedSurvey = await prisma.surveyAnswers.findUnique({
        where: { id: surveyAnswer.id },
      });

      expect(updatedSurvey?.content).toBe(
        JSON.stringify({ q1: "Updated answer" }),
      );
      expect(updatedSurvey?.status).toBe("COMPLETED");
      expect(updatedSurvey?.completed_at).not.toBeNull();
    });

    it("should create new survey answer when none exists", async () => {
      const plan = await prisma.diagnosisTreatmentPlan.create({
        data: {
          client_id: testClient.id,
          title: "Plan without Survey",
        },
      });

      const requestBody = {
        id: plan.id,
        clientId: testClient.id,
        title: "Plan with New Survey",
        diagnoses: [],
        surveyData: {
          templateId: testTemplate.id,
          content: { q1: "New answer" },
        },
      };

      const request = createRequestWithBody(
        "/api/diagnosis-treatment-plan",
        requestBody,
        { method: "PUT" },
      );
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.survey_answers_id).not.toBeNull();
      expect(data.SurveyAnswers).not.toBeNull();
    });
  });

  describe("DELETE", () => {
    it("should delete a treatment plan and its items", async () => {
      const plan = await prisma.diagnosisTreatmentPlan.create({
        data: {
          client_id: testClient.id,
          title: "Plan to Delete",
        },
      });

      await prisma.diagnosisTreatmentPlanItem.create({
        data: {
          treatment_plan_id: plan.id,
          diagnosis_id: testDiagnosis.id,
        },
      });

      const request = createRequest(
        `/api/diagnosis-treatment-plan?id=${plan.id}`,
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Treatment plan deleted successfully");

      // Verify deletion
      const deletedPlan = await prisma.diagnosisTreatmentPlan.findUnique({
        where: { id: plan.id },
      });
      expect(deletedPlan).toBeNull();

      const deletedItems = await prisma.diagnosisTreatmentPlanItem.findMany({
        where: { treatment_plan_id: plan.id },
      });
      expect(deletedItems).toHaveLength(0);
    });

    it("should delete orphaned survey answers", async () => {
      const surveyAnswer = await prisma.surveyAnswers.create({
        data: {
          template_id: testTemplate.id,
          client_id: testClient.id,
          content: JSON.stringify({ q1: "Answer" }),
          status: "COMPLETED",
          assigned_at: new Date(),
        },
      });

      const plan = await prisma.diagnosisTreatmentPlan.create({
        data: {
          client_id: testClient.id,
          title: "Plan with Orphaned Survey",
          survey_answers_id: surveyAnswer.id,
        },
      });

      const request = createRequest(
        `/api/diagnosis-treatment-plan?id=${plan.id}`,
      );

      const response = await DELETE(request);
      expect(response.status).toBe(200);

      // Verify survey answer was deleted
      const deletedSurvey = await prisma.surveyAnswers.findUnique({
        where: { id: surveyAnswer.id },
      });
      expect(deletedSurvey).toBeNull();
    });

    it("should preserve survey answers with other references", async () => {
      const surveyAnswer = await prisma.surveyAnswers.create({
        data: {
          template_id: testTemplate.id,
          client_id: testClient.id,
          content: JSON.stringify({ q1: "Answer" }),
          status: "COMPLETED",
          assigned_at: new Date(),
        },
      });

      // Create two plans referencing the same survey
      const plan1 = await prisma.diagnosisTreatmentPlan.create({
        data: {
          client_id: testClient.id,
          title: "Plan 1",
          survey_answers_id: surveyAnswer.id,
        },
      });

      const plan2 = await prisma.diagnosisTreatmentPlan.create({
        data: {
          client_id: testClient.id,
          title: "Plan 2",
          survey_answers_id: surveyAnswer.id,
        },
      });

      // Delete plan1
      const request = createRequest(
        `/api/diagnosis-treatment-plan?id=${plan1.id}`,
      );

      const response = await DELETE(request);
      expect(response.status).toBe(200);

      // Verify survey answer was preserved
      const preservedSurvey = await prisma.surveyAnswers.findUnique({
        where: { id: surveyAnswer.id },
      });
      expect(preservedSurvey).not.toBeNull();

      // Verify plan2 still exists
      const plan2InDb = await prisma.diagnosisTreatmentPlan.findUnique({
        where: { id: plan2.id },
      });
      expect(plan2InDb).not.toBeNull();
    });

    it("should return 404 for non-existent plan", async () => {
      const request = createRequest(
        "/api/diagnosis-treatment-plan?id=non-existent-id",
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Treatment plan not found");
    });
  });
});
