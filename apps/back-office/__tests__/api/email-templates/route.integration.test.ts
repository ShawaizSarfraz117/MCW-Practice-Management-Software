import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { EmailTemplate, prisma } from "@mcw/database";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { DELETE, GET, POST } from "@/api/email-templates/route";
import { GET as GETById, PUT } from "@/api/email-templates/[id]/route";

describe("Email Templates API", () => {
  let testTemplate: EmailTemplate;
  const TEST_USER_ID = "dffa4ae9-55a4-48f9-8ee2-d06996b828ea";

  beforeAll(async () => {
    // Create a test template with all fields using prisma directly
    testTemplate = await prisma.emailTemplate.create({
      data: {
        name: "Test Template",
        subject: "Test Subject",
        content: "Test Content",
        type: "Test Type",
        email_type: "Test Email Type",
        created_by: TEST_USER_ID,
      },
    });
  });

  afterAll(async () => {
    if (testTemplate?.id) {
      await prisma.emailTemplate.deleteMany({
        where: {
          id: testTemplate.id,
        },
      });
    }
  });

  describe("GET /api/email-templates", () => {
    it("should get all email templates", async () => {
      const req = createRequest("/api/email-templates");
      const response = await GET(req);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toHaveProperty("data");
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data).toEqual([
        expect.objectContaining({
          id: testTemplate.id,
          name: testTemplate.name,
          subject: testTemplate.subject,
          content: testTemplate.content,
          type: testTemplate.type,
          email_type: testTemplate.email_type,
          created_by: testTemplate.created_by,
        }),
      ]);
    });

    it("should filter templates by type", async () => {
      const req = createRequest("/api/email-templates?type=Test Type");
      const response = await GET(req);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data).toEqual([
        expect.objectContaining({
          type: "Test Type",
        }),
      ]);
    });
  });

  describe("POST /api/email-templates", () => {
    it("should create a new email template", async () => {
      const newTemplate = {
        name: "New Template",
        subject: "New Subject",
        content: "New Content",
        type: "New Type",
        email_type: "New Email Type",
      };

      const req = createRequestWithBody("/api/email-templates", newTemplate, {
        headers: { "user-id": TEST_USER_ID },
      });
      const response = await POST(req);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data).toMatchObject({
        ...newTemplate,
        created_by: TEST_USER_ID,
      });

      // Clean up
      await prisma.emailTemplate.delete({
        where: { id: json.data.id },
      });
    });

    it("should return 400 if required fields are missing", async () => {
      const incompleteTemplate = {
        name: "Incomplete Template",
        // Missing required fields
      };

      const req = createRequestWithBody(
        "/api/email-templates",
        incompleteTemplate,
        {
          headers: { "user-id": TEST_USER_ID },
        },
      );
      const response = await POST(req);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty("error");
    });

    it("should return 401 if user-id is missing", async () => {
      const newTemplate = {
        name: "New Template",
        subject: "New Subject",
        content: "New Content",
        type: "New Type",
      };

      const req = createRequestWithBody("/api/email-templates", newTemplate);
      const response = await POST(req);

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toHaveProperty("error");
    });
  });

  describe("GET /api/email-templates/[id]", () => {
    it("should get a single email template by id", async () => {
      const req = createRequest(`/api/email-templates/${testTemplate.id}`);
      const response = await GETById(req, { params: { id: testTemplate.id } });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data).toMatchObject({
        id: testTemplate.id,
        name: testTemplate.name,
        subject: testTemplate.subject,
        content: testTemplate.content,
        type: testTemplate.type,
        email_type: testTemplate.email_type,
        created_by: testTemplate.created_by,
      });
    });

    it("should return 404 for non-existent template", async () => {
      const nonExistentId = "dffa4ae9-55a4-48f9-8ee2-d06996b828eb";
      const req = createRequest(`/api/email-templates/${nonExistentId}`);
      const response = await GETById(req, { params: { id: nonExistentId } });

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json).toHaveProperty("error");
    });
  });

  describe("PUT /api/email-templates/[id]", () => {
    it("should update an existing email template", async () => {
      const updatedData = {
        name: "Updated Template",
        subject: "Updated Subject",
        content: "Updated Content",
        type: "Updated Type",
        email_type: "Updated Email Type",
      };

      const req = createRequestWithBody(
        `/api/email-templates/${testTemplate.id}`,
        updatedData,
        { method: "PUT" },
      );
      const response = await PUT(req, { params: { id: testTemplate.id } });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data).toMatchObject({
        id: testTemplate.id,
        ...updatedData,
      });
    });

    it("should return 400 if required fields are missing", async () => {
      const incompleteData = {
        name: "Incomplete Update",
        // Missing required fields
      };

      const req = createRequestWithBody(
        `/api/email-templates/${testTemplate.id}`,
        incompleteData,
        { method: "PUT" },
      );
      const response = await PUT(req, { params: { id: testTemplate.id } });

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty("error");
    });
  });

  describe("DELETE /api/email-templates", () => {
    it("should delete an email template", async () => {
      const req = createRequest(`/api/email-templates/?id=${testTemplate.id}`, {
        method: "DELETE",
      });
      const response = await DELETE(req);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data).toHaveProperty("success", true);

      const deletedTemplate = await prisma.emailTemplate.findUnique({
        where: { id: testTemplate.id },
      });
      expect(deletedTemplate).toBeNull();
    });

    it("should return 400 if template ID is missing", async () => {
      const req = createRequest("/api/email-templates/", { method: "DELETE" });
      const response = await DELETE(req);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty("error");
    });
  });
});
