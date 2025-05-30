import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@mcw/database";
import { GET } from "@/api/reminder-text-templates/route";

interface ReminderTextTemplate {
  id: string;
  type: string;
  content: string;
}

describe("GET /api/reminder-text-templates Integration Tests", () => {
  const testTemplates = [
    {
      type: "main-test-appointment",
      content:
        "Hi {{clientName}}, your appointment is on {{appointmentDate}} at {{appointmentTime}}.",
    },
    {
      type: "main-test-telehealth",
      content:
        "Your telehealth session with {{clinicianName}} starts in 15 minutes. Join here: {{sessionLink}}",
    },
    {
      type: "main-test-document",
      content:
        "A new document {{documentName}} has been shared with you by {{practiceName}}.",
    },
    {
      type: "main-test-cancellation",
      content:
        "Your appointment on {{appointmentDate}} has been cancelled. Please contact us to reschedule.",
    },
  ];

  let createdTemplateIds: string[] = [];

  beforeAll(async () => {
    // Clean up any existing test data first
    await prisma.reminderTextTemplates.deleteMany({
      where: {
        type: {
          in: testTemplates.map((t) => t.type),
        },
      },
    });

    // Create test templates and store their auto-generated IDs
    for (const template of testTemplates) {
      const createdTemplate = await prisma.reminderTextTemplates.create({
        data: template,
      });
      createdTemplateIds.push(createdTemplate.id);
    }
  });

  afterAll(async () => {
    // Clean up test data using the generated IDs
    await prisma.reminderTextTemplates.deleteMany({
      where: {
        id: {
          in: createdTemplateIds,
        },
      },
    });

    await prisma.$disconnect();
  });

  it("should return all templates from the database ordered by type", async () => {
    const response = await GET();
    const data = (await response.json()) as ReminderTextTemplate[];

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(testTemplates.length);

    // Find our test templates in the response
    const returnedTestTemplates = data.filter(
      (template: ReminderTextTemplate) =>
        createdTemplateIds.includes(template.id),
    );

    expect(returnedTestTemplates).toHaveLength(testTemplates.length);

    // Verify templates are ordered by type (ascending)
    const types = returnedTestTemplates.map(
      (template: ReminderTextTemplate) => template.type,
    );
    const sortedTypes = [...types].sort();
    expect(types).toEqual(sortedTypes);

    // Verify each test template exists with correct data
    for (const expectedTemplate of testTemplates) {
      const foundTemplate = returnedTestTemplates.find(
        (template: ReminderTextTemplate) =>
          template.type === expectedTemplate.type,
      );

      expect(foundTemplate).toBeDefined();
      if (foundTemplate) {
        expect(foundTemplate.type).toBe(expectedTemplate.type);
        expect(foundTemplate.content).toBe(expectedTemplate.content);
      }
    }
  });

  it("should handle empty database gracefully", async () => {
    // Temporarily remove all templates
    await prisma.reminderTextTemplates.deleteMany();

    const response = await GET();
    const data = (await response.json()) as ReminderTextTemplate[];

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(0);

    // Restore test data for other tests
    createdTemplateIds = [];
    for (const template of testTemplates) {
      const createdTemplate = await prisma.reminderTextTemplates.create({
        data: template,
      });
      createdTemplateIds.push(createdTemplate.id);
    }
  });

  it("should return consistent data structure", async () => {
    const response = await GET();
    const data = (await response.json()) as ReminderTextTemplate[];

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);

    if (data.length > 0) {
      const template = data[0];
      expect(template).toHaveProperty("id");
      expect(template).toHaveProperty("type");
      expect(template).toHaveProperty("content");
      expect(typeof template.id).toBe("string");
      expect(typeof template.type).toBe("string");
      expect(typeof template.content).toBe("string");
    }
  });

  it("should maintain data integrity across multiple requests", async () => {
    // Make multiple requests to ensure consistency
    const responses = await Promise.all([GET(), GET(), GET()]);

    const dataArrays = (await Promise.all(
      responses.map((response) => response.json()),
    )) as ReminderTextTemplate[][];

    // All responses should be successful
    responses.forEach((response) => {
      expect(response.status).toBe(200);
    });

    // All responses should return arrays with consistent structure
    // Note: We don't check exact length since other tests may be running in parallel
    dataArrays.forEach((data) => {
      expect(Array.isArray(data)).toBe(true);
      // Check that all data has the same structure
      expect(
        data.every(
          (item) =>
            typeof item.id === "string" &&
            typeof item.type === "string" &&
            typeof item.content === "string",
        ),
      ).toBe(true);
    });

    // At minimum, our test templates should be present in each response
    dataArrays.forEach((data) => {
      const ourTemplates = data.filter((template: ReminderTextTemplate) =>
        createdTemplateIds.includes(template.id),
      );
      expect(ourTemplates).toHaveLength(testTemplates.length);
    });
  });
});
