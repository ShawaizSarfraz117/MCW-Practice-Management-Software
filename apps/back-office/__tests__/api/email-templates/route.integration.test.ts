import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { EmailTemplate, prisma } from "@mcw/database";
import { EmailTemplatePrismaFactory } from "@mcw/database/mock-data";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { DELETE, GET } from "@/api/email-templates/route";
import { GET as GETById, PUT } from "@/api/email-templates/[id]/route";

describe("Email Templates API", () => {
  let testTemplate: EmailTemplate;

  beforeAll(async () => {
    testTemplate = await EmailTemplatePrismaFactory.create();
  });

  afterAll(async () => {
    await prisma.emailTemplate.deleteMany({
      where: {
        id: testTemplate.id,
      },
    });
  });

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
      }),
    ]);
  });

  it("should get a single email template by id", async () => {
    const req = createRequest(`/api/email-templates/${testTemplate.id}`);
    const response = await GETById(req, { params: { id: testTemplate.id } });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toHaveProperty("data");
    expect(json.data).toMatchObject({
      id: testTemplate.id,
      name: testTemplate.name,
      subject: testTemplate.subject,
      content: testTemplate.content,
      type: testTemplate.type,
    });
  });

  it("should update an existing email template", async () => {
    const updatedData = {
      name: "Updated Template",
      subject: "Updated Subject",
      content: "Updated Content",
      type: "Updated Type",
    };
    const req = createRequestWithBody(
      `/api/email-templates/${testTemplate.id}`,
      updatedData,
      {
        method: "PUT",
      },
    );
    const response = await PUT(req, { params: { id: testTemplate.id } });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toHaveProperty("data");
    expect(json.data).toMatchObject({
      id: testTemplate.id,
      name: updatedData.name,
      subject: updatedData.subject,
      content: updatedData.content,
      type: updatedData.type,
    });
  });

  it("should delete an email template", async () => {
    const req = createRequest(`/api/email-templates/?id=${testTemplate.id}`, {
      method: "DELETE",
    });
    const response = await DELETE(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toHaveProperty("data");
    expect(json.data).toHaveProperty("success", true);

    const deletedTemplate = await prisma.emailTemplate.findUnique({
      where: { id: testTemplate.id },
    });
    expect(deletedTemplate).toBeNull();
  });
});
