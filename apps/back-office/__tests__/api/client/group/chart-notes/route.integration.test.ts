import { describe, it, expect, beforeEach, afterEach, afterAll } from "vitest";
import {
  POST as createChartNote,
  GET as getChartNotes,
} from "@/api/client/group/chart-notes/route";
import {
  PUT as updateChartNote,
  DELETE as deleteChartNote,
} from "@/api/client/group/chart-notes/[chartNoteId]/route";
import { prisma } from "@mcw/database";
import {
  ClientGroupPrismaFactory,
  ClientGroupChartNotePrismaFactory,
} from "@mcw/database/mock-data";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { faker } from "@faker-js/faker";
import type { ClientGroup, ClientGroupChartNote } from "@prisma/client";

describe("/api/client/group/chart-notes API endpoint integration tests", () => {
  let clientGroup: ClientGroup;
  let createdEntityIds: string[] = [];

  beforeEach(async () => {
    // Clean up any existing data - order matters due to foreign key constraints
    await prisma.clientGroupChartNote.deleteMany({});
    await prisma.clientGroupMembership.deleteMany({});
    await prisma.appointment.deleteMany({}); // Delete appointments before client groups
    await prisma.clientGroup.deleteMany({});

    // Create a test client group
    clientGroup = await ClientGroupPrismaFactory.create();
    createdEntityIds.push(clientGroup.id);
  });

  afterEach(async () => {
    // Clean up created entities
    if (createdEntityIds.length > 0) {
      await prisma.clientGroupChartNote.deleteMany({
        where: {
          id: { in: createdEntityIds.filter((id) => id !== clientGroup.id) },
        },
      });
      createdEntityIds = [clientGroup.id]; // Keep only the client group for next test
    }
  });

  afterAll(async () => {
    // Final cleanup - order matters due to foreign key constraints
    await prisma.clientGroupChartNote.deleteMany({});
    await prisma.clientGroupMembership.deleteMany({});
    await prisma.appointment.deleteMany({}); // Delete appointments before client groups
    await prisma.clientGroup.deleteMany({});
    await prisma.$disconnect();
  });

  // POST tests
  describe("POST /api/client/group/chart-notes", () => {
    it("should create a new chart note successfully", async () => {
      const noteData = {
        client_group_id: clientGroup.id,
        text: faker.lorem.sentence(),
        note_date: faker.date.past().toISOString(),
      };

      const req = createRequestWithBody(
        "/api/client/group/chart-notes",
        noteData,
      );
      const response = await createChartNote(req);
      const result = await response.json();

      expect(response.status).toBe(201);
      expect(result.client_group_id).toBe(noteData.client_group_id);
      expect(result.text).toBe(noteData.text);
      expect(new Date(result.note_date).toISOString()).toBe(noteData.note_date);
      expect(result.id).toBeDefined();

      // Store ID for cleanup
      createdEntityIds.push(result.id);

      // Verify entity was created in database
      const dbNote = await prisma.clientGroupChartNote.findUnique({
        where: { id: result.id },
      });
      expect(dbNote).not.toBeNull();
      expect(dbNote?.text).toBe(noteData.text);
    });

    it("should return 400 if required fields are missing", async () => {
      const incompleteData = {
        client_group_id: clientGroup.id,
      };

      const req = createRequestWithBody(
        "/api/client/group/chart-notes",
        incompleteData,
      );
      const response = await createChartNote(req);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.message).toContain("Missing required fields");
    });

    it("should return 400 if client_group_id is invalid", async () => {
      const noteData = {
        client_group_id: faker.string.uuid(), // Non-existent ID
        text: faker.lorem.sentence(),
        note_date: faker.date.past().toISOString(),
      };

      const req = createRequestWithBody(
        "/api/client/group/chart-notes",
        noteData,
      );
      const response = await createChartNote(req);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.message).toContain("Invalid client_group_id");
    });

    it("should return 400 for invalid JSON payload", async () => {
      const req = createRequest("/api/client/group/chart-notes", {
        method: "POST",
      });
      req.json = () => Promise.reject(new SyntaxError("Unexpected token"));

      const response = await createChartNote(req);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.message).toBe("Invalid JSON payload");
    });
  });

  // GET tests
  describe("GET /api/client/group/chart-notes", () => {
    it("should fetch chart notes for a valid clientGroupId", async () => {
      // Create test chart notes
      const chartNote1 = await ClientGroupChartNotePrismaFactory.create({
        ClientGroup: { connect: { id: clientGroup.id } },
      });
      const chartNote2 = await ClientGroupChartNotePrismaFactory.create({
        ClientGroup: { connect: { id: clientGroup.id } },
      });
      createdEntityIds.push(chartNote1.id, chartNote2.id);

      const req = createRequest(
        `/api/client/group/chart-notes?clientGroupId=${clientGroup.id}`,
      );
      const response = await getChartNotes(req);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0].client_group_id).toBe(clientGroup.id);

      // Verify entities are in response
      const foundNotes = result.filter(
        (note: ClientGroupChartNote) =>
          note.id === chartNote1.id || note.id === chartNote2.id,
      );
      expect(foundNotes).toHaveLength(2);
    });

    it("should return an empty array if no notes exist for clientGroupId", async () => {
      const req = createRequest(
        `/api/client/group/chart-notes?clientGroupId=${clientGroup.id}`,
      );
      const response = await getChartNotes(req);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it("should return 400 if clientGroupId query parameter is missing", async () => {
      const req = createRequest("/api/client/group/chart-notes");
      const response = await getChartNotes(req);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.message).toBe("Missing clientGroupId query parameter.");
    });
  });

  // PUT tests
  describe("PUT /api/client/group/chart-notes/[chartNoteId]", () => {
    let chartNote: ClientGroupChartNote;

    beforeEach(async () => {
      chartNote = await ClientGroupChartNotePrismaFactory.create({
        ClientGroup: { connect: { id: clientGroup.id } },
      });
      createdEntityIds.push(chartNote.id);
    });

    it("should update a chart note successfully", async () => {
      const updatedData = {
        text: faker.lorem.paragraph(),
        note_date: faker.date.recent().toISOString(),
      };

      const req = createRequestWithBody(
        "/api/client/group/chart-notes/[chartNoteId]",
        updatedData,
        { method: "PUT" },
      );
      const params = { chartNoteId: chartNote.id };
      const response = await updateChartNote(req, { params });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.text).toBe(updatedData.text);
      expect(new Date(result.note_date).toISOString()).toBe(
        updatedData.note_date,
      );
      expect(result.id).toBe(chartNote.id);

      // Verify entity was updated in database
      const updatedNote = await prisma.clientGroupChartNote.findUnique({
        where: { id: chartNote.id },
      });
      expect(updatedNote?.text).toBe(updatedData.text);
    });

    it("should return 404 if chart note to update is not found", async () => {
      const updateData = { text: "Updated text" };
      const nonExistentId = faker.string.uuid();

      const req = createRequestWithBody(
        "/api/client/group/chart-notes/[chartNoteId]",
        updateData,
        { method: "PUT" },
      );
      const params = { chartNoteId: nonExistentId };
      const response = await updateChartNote(req, { params });
      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.message).toBe("Chart note not found.");
    });

    it("should return 400 if no fields are provided for update", async () => {
      const req = createRequestWithBody(
        "/api/client/group/chart-notes/[chartNoteId]",
        {},
        { method: "PUT" },
      );
      const params = { chartNoteId: chartNote.id };
      const response = await updateChartNote(req, { params });
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.message).toBe(
        "No fields to update. Provide text or note_date.",
      );
    });

    it("should return 400 for invalid JSON payload on update", async () => {
      const req = createRequest("/api/client/group/chart-notes/[chartNoteId]", {
        method: "PUT",
      });
      req.json = () => Promise.reject(new SyntaxError("Unexpected token"));

      const params = { chartNoteId: chartNote.id };
      const response = await updateChartNote(req, { params });
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.message).toBe("Invalid JSON payload");
    });
  });

  // DELETE tests
  describe("DELETE /api/client/group/chart-notes/[chartNoteId]", () => {
    let chartNote: ClientGroupChartNote;

    beforeEach(async () => {
      chartNote = await ClientGroupChartNotePrismaFactory.create({
        ClientGroup: { connect: { id: clientGroup.id } },
      });
      createdEntityIds.push(chartNote.id);
    });

    it("should delete a chart note successfully", async () => {
      const req = createRequest("/api/client/group/chart-notes/[chartNoteId]", {
        method: "DELETE",
      });
      const params = { chartNoteId: chartNote.id };
      const response = await deleteChartNote(req, { params });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.message).toBe("Chart note deleted successfully.");

      // Verify entity was deleted from database
      const deletedNote = await prisma.clientGroupChartNote.findUnique({
        where: { id: chartNote.id },
      });
      expect(deletedNote).toBeNull();
    });

    it("should return 404 if chart note to delete is not found", async () => {
      const nonExistentId = faker.string.uuid();

      const req = createRequest("/api/client/group/chart-notes/[chartNoteId]", {
        method: "DELETE",
      });
      const params = { chartNoteId: nonExistentId };
      const response = await deleteChartNote(req, { params });
      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.message).toBe("Chart note not found.");
    });
  });
});
