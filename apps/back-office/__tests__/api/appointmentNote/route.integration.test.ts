/* eslint-disable max-lines-per-function */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { GET, POST, PUT, DELETE } from "@/api/appointmentNote/route";
import {
  prisma,
  Practice,
  User,
  Client,
  Clinician,
  SurveyTemplate,
  Appointment,
} from "@mcw/database";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { getBackOfficeSession } from "@/utils/helpers";
import type { Session } from "next-auth";

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

describe("appointmentNote API - Integration Tests", () => {
  let testPractice: Practice;
  let testUser: User;
  let testClient: Client;
  let testClinician: Clinician;
  let testTemplate: SurveyTemplate;
  let testAppointment: Appointment;

  beforeEach(async () => {
    vi.mocked(getBackOfficeSession).mockResolvedValue(mockSession as Session);

    // Create test data
    testPractice = await prisma.practice.create({
      data: {
        name: "Test Practice",
        email: "practice@test.com",
        phone: "1234567890",
        city: "Test City",
        state: "TS",
        zip: "12345",
        address_line_1: "123 Test St",
      },
    });

    testUser = await prisma.user.create({
      data: {
        email: "test@example.com",
        first_name: "Test",
        last_name: "User",
        password_hash: "hash",
        practice_id: testPractice.id,
        role: "ADMIN",
      },
    });

    testClient = await prisma.client.create({
      data: {
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@example.com",
        phone_primary: "9876543210",
        practice_id: testPractice.id,
      },
    });

    testClinician = await prisma.clinician.create({
      data: {
        user_id: testUser.id,
        practice_id: testPractice.id,
      },
    });

    testTemplate = await prisma.template.create({
      data: {
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
        practice_id: testPractice.id,
      },
    });

    // Create a test appointment
    testAppointment = await prisma.appointment.create({
      data: {
        title: "Test Appointment",
        start_date: new Date(),
        end_date: new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
        status: "SCHEDULED",
        appointment_type_id: "90834", // Standard therapy session
        clinician_id: testClinician.id,
        practice_id: testPractice.id,
      },
    });

    // Create appointment-client relationship
    await prisma.appointmentClients.create({
      data: {
        appointment_id: testAppointment.id,
        client_id: testClient.id,
      },
    });
  });

  afterEach(async () => {
    // Clean up in reverse order of creation
    await prisma.surveyAnswers.deleteMany({
      where: { client_id: testClient?.id },
    });
    await prisma.appointmentClients.deleteMany({
      where: { appointment_id: testAppointment?.id },
    });
    await prisma.appointment.deleteMany({
      where: { id: testAppointment?.id },
    });
    await prisma.template.deleteMany({
      where: { id: testTemplate?.id },
    });
    await prisma.clinician.deleteMany({
      where: { id: testClinician?.id },
    });
    await prisma.client.deleteMany({
      where: { id: testClient?.id },
    });
    await prisma.user.deleteMany({
      where: { id: testUser?.id },
    });
    await prisma.practice.deleteMany({
      where: { id: testPractice?.id },
    });
  });

  describe("GET", () => {
    it("should fetch note by appointment_id", async () => {
      // Create a survey answer
      const surveyAnswer = await prisma.surveyAnswers.create({
        data: {
          template_id: testTemplate.id,
          client_id: testClient.id,
          content: JSON.stringify({ question1: "I'm feeling good" }),
          status: "COMPLETED",
          appointment_id: testAppointment.id,
          completed_at: new Date(),
          assigned_at: new Date(),
        },
      });

      const request = createRequest(
        `/api/appointmentNote?appointment_id=${testAppointment.id}`,
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe(surveyAnswer.id);
      expect(data.appointment_id).toBe(testAppointment.id);
      expect(data.template.name).toBe("Progress Note Template");
      expect(data.client.first_name).toBe("John");
    });

    it("should return 404 when note not found", async () => {
      const request = createRequest(
        "/api/appointmentNote?appointment_id=nonexistent-id",
      );
      const response = await GET(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Note not found for this appointment");
    });

    it("should fetch all notes by client_id", async () => {
      // Create multiple survey answers
      await prisma.surveyAnswers.createMany({
        data: [
          {
            template_id: testTemplate.id,
            client_id: testClient.id,
            content: JSON.stringify({ question1: "Answer 1" }),
            status: "COMPLETED",
            completed_at: new Date(),
            assigned_at: new Date(),
          },
          {
            template_id: testTemplate.id,
            client_id: testClient.id,
            content: JSON.stringify({ question1: "Answer 2" }),
            status: "COMPLETED",
            completed_at: new Date(),
            assigned_at: new Date(),
          },
        ],
      });

      const request = createRequest(
        `/api/appointmentNote?client_id=${testClient.id}`,
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveLength(2);
      expect(data[0].client_id).toBe(testClient.id);
      expect(data[1].client_id).toBe(testClient.id);
    });
  });

  describe("POST", () => {
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
      // Create first note
      await prisma.surveyAnswers.create({
        data: {
          template_id: testTemplate.id,
          client_id: testClient.id,
          content: JSON.stringify({ question1: "First answer" }),
          status: "COMPLETED",
          appointment_id: testAppointment.id,
          completed_at: new Date(),
          assigned_at: new Date(),
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
  });

  describe("PUT", () => {
    let existingNote: import("@mcw/database").SurveyAnswers;

    beforeEach(async () => {
      existingNote = await prisma.surveyAnswers.create({
        data: {
          template_id: testTemplate.id,
          client_id: testClient.id,
          content: JSON.stringify({ question1: "Original answer" }),
          status: "DRAFT",
          appointment_id: testAppointment.id,
          completed_at: new Date(),
          assigned_at: new Date(),
        },
      });
    });

    it("should update existing note by appointment_id", async () => {
      const updatePayload = {
        id: testAppointment.id,
        content: JSON.stringify({ question1: "Updated answer" }),
        status: "COMPLETED",
      };

      const request = createRequestWithBody(
        "/api/appointmentNote",
        updatePayload,
        "PUT",
      );
      const response = await PUT(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.content).toBe(updatePayload.content);
      expect(data.status).toBe("COMPLETED");

      // Verify in database
      const updated = await prisma.surveyAnswers.findUnique({
        where: { id: existingNote.id },
      });
      expect(updated?.content).toBe(updatePayload.content);
      expect(updated?.status).toBe("COMPLETED");
    });

    it("should update existing note by id", async () => {
      const updatePayload = {
        id: existingNote.id,
        content: JSON.stringify({ question1: "Updated by ID" }),
      };

      const request = createRequestWithBody(
        "/api/appointmentNote",
        updatePayload,
        "PUT",
      );
      const response = await PUT(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.content).toBe(updatePayload.content);
    });

    it("should return 404 if note not found", async () => {
      const updatePayload = {
        id: "nonexistent-id",
        content: JSON.stringify({ question1: "Updated" }),
      };

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
  });

  describe("DELETE", () => {
    let noteToDelete: import("@mcw/database").SurveyAnswers;

    beforeEach(async () => {
      noteToDelete = await prisma.surveyAnswers.create({
        data: {
          template_id: testTemplate.id,
          client_id: testClient.id,
          content: JSON.stringify({ question1: "To be deleted" }),
          status: "COMPLETED",
          appointment_id: testAppointment.id,
          completed_at: new Date(),
          assigned_at: new Date(),
        },
      });
    });

    it("should delete note by id", async () => {
      const request = createRequest(
        `/api/appointmentNote?id=${noteToDelete.id}`,
        "DELETE",
      );
      const response = await DELETE(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe("Note deleted successfully");
      expect(data.id).toBe(noteToDelete.id);

      // Verify deletion
      const deleted = await prisma.surveyAnswers.findUnique({
        where: { id: noteToDelete.id },
      });
      expect(deleted).toBeNull();
    });

    it("should delete note by appointment_id", async () => {
      const request = createRequest(
        `/api/appointmentNote?appointment_id=${testAppointment.id}`,
        "DELETE",
      );
      const response = await DELETE(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe("Note deleted successfully");

      // Verify deletion
      const deleted = await prisma.surveyAnswers.findUnique({
        where: { id: noteToDelete.id },
      });
      expect(deleted).toBeNull();
    });

    it("should return 404 if note not found", async () => {
      const request = createRequest(
        "/api/appointmentNote?id=nonexistent-id",
        "DELETE",
      );
      const response = await DELETE(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Note not found");
    });

    it("should return 400 if no id provided", async () => {
      const request = createRequest("/api/appointmentNote", "DELETE");
      const response = await DELETE(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Note ID or appointment ID is required");
    });
  });
});
