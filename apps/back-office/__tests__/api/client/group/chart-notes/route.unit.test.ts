/* eslint-disable max-lines-per-function */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  POST as createChartNoteHandler,
  GET as getChartNotesHandler,
} from "@/api/client/group/chart-notes/route";
import {
  PUT as updateChartNoteHandler,
  DELETE as deleteChartNoteHandler,
} from "@/api/client/group/chart-notes/[chartNoteId]/route";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { faker } from "@faker-js/faker";
import type { ClientGroup, ClientGroupChartNote } from "@prisma/client";
import prismaMock from "@mcw/database/mock";
import { Decimal } from "@prisma/client/runtime/library";

describe("Client Group Chart Notes API Unit Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // Helper function to create mock data
  const mockClientGroup = (
    overrides: Partial<ClientGroup> = {},
  ): ClientGroup => ({
    id: faker.string.uuid(),
    type: "FAMILY",
    name: faker.company.name(),
    clinician_id: faker.string.uuid(),
    available_credit: new Decimal(0),
    is_active: true,
    created_at: faker.date.recent(),
    auto_monthly_statement_enabled: false,
    auto_monthly_superbill_enabled: false,
    first_seen_at: faker.date.recent(),
    notes: null,
    ...overrides,
  });

  const mockChartNote = (
    overrides: Partial<ClientGroupChartNote> = {},
  ): ClientGroupChartNote => ({
    id: faker.string.uuid(),
    client_group_id: faker.string.uuid(),
    text: faker.lorem.paragraph(),
    note_date: faker.date.recent(),
    ...overrides,
  });

  // POST /api/client/group/chart-notes
  describe("POST handler", () => {
    const defaultNoteData = {
      client_group_id: faker.string.uuid(),
      text: faker.lorem.sentence(),
      note_date: faker.date.past().toISOString(),
    };

    it("should create a chart note successfully", async () => {
      const clientGroup = mockClientGroup({
        id: defaultNoteData.client_group_id,
      });
      const createdNote = mockChartNote({
        ...defaultNoteData,
        note_date: new Date(defaultNoteData.note_date),
      });

      prismaMock.clientGroup.findUnique.mockResolvedValueOnce(clientGroup);
      prismaMock.clientGroupChartNote.create.mockResolvedValueOnce(createdNote);

      const req = createRequestWithBody(
        "/api/client/group/chart-notes",
        defaultNoteData,
      );
      const response = await createChartNoteHandler(req);
      const result = await response.json();

      expect(response.status).toBe(201);
      expect(result.id).toBe(createdNote.id);
      expect(result.client_group_id).toBe(defaultNoteData.client_group_id);
      expect(result.text).toBe(defaultNoteData.text);

      expect(prismaMock.clientGroup.findUnique).toHaveBeenCalledWith({
        where: { id: defaultNoteData.client_group_id },
      });
      expect(prismaMock.clientGroupChartNote.create).toHaveBeenCalledWith({
        data: {
          client_group_id: defaultNoteData.client_group_id,
          text: defaultNoteData.text,
          note_date: new Date(defaultNoteData.note_date),
        },
      });
    });

    it("should return 400 if required fields are missing", async () => {
      const incompleteData = { client_group_id: faker.string.uuid() };

      const req = createRequestWithBody(
        "/api/client/group/chart-notes",
        incompleteData,
      );
      const response = await createChartNoteHandler(req);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.message).toContain("Missing required fields");
      expect(prismaMock.clientGroup.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.clientGroupChartNote.create).not.toHaveBeenCalled();
    });

    it("should return 400 if client_group_id is invalid/not found", async () => {
      prismaMock.clientGroup.findUnique.mockResolvedValueOnce(null);

      const req = createRequestWithBody(
        "/api/client/group/chart-notes",
        defaultNoteData,
      );
      const response = await createChartNoteHandler(req);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.message).toContain("Invalid client_group_id");
      expect(prismaMock.clientGroupChartNote.create).not.toHaveBeenCalled();
    });

    it("should return 500 if database create fails", async () => {
      const clientGroup = mockClientGroup({
        id: defaultNoteData.client_group_id,
      });
      prismaMock.clientGroup.findUnique.mockResolvedValueOnce(clientGroup);
      prismaMock.clientGroupChartNote.create.mockRejectedValueOnce(
        new Error("DB error"),
      );

      const req = createRequestWithBody(
        "/api/client/group/chart-notes",
        defaultNoteData,
      );
      const response = await createChartNoteHandler(req);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.message).toBe("Internal server error");
    });

    it("should return 400 for invalid JSON payload", async () => {
      const req = createRequest("/api/client/group/chart-notes", {
        method: "POST",
      });
      req.json = () => Promise.reject(new SyntaxError("Unexpected token"));

      const response = await createChartNoteHandler(req);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.message).toBe("Invalid JSON payload");
    });
  });

  // GET /api/client/group/chart-notes
  describe("GET handler", () => {
    const clientGroupId = faker.string.uuid();

    it("should fetch chart notes successfully", async () => {
      const mockNotes = [
        mockChartNote({ client_group_id: clientGroupId }),
        mockChartNote({ client_group_id: clientGroupId }),
      ];

      prismaMock.clientGroupChartNote.findMany.mockResolvedValueOnce(mockNotes);

      const req = createRequest(
        `/api/client/group/chart-notes?clientGroupId=${clientGroupId}`,
      );
      const response = await getChartNotesHandler(req);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0].id).toBe(mockNotes[0].id);

      expect(prismaMock.clientGroupChartNote.findMany).toHaveBeenCalledWith({
        where: { client_group_id: clientGroupId },
        orderBy: { note_date: "desc" },
      });
    });

    it("should return 400 if clientGroupId is missing", async () => {
      const req = createRequest("/api/client/group/chart-notes");
      const response = await getChartNotesHandler(req);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.message).toBe("Missing clientGroupId query parameter.");
      expect(prismaMock.clientGroupChartNote.findMany).not.toHaveBeenCalled();
    });

    it("should return 500 if database findMany fails", async () => {
      prismaMock.clientGroupChartNote.findMany.mockRejectedValueOnce(
        new Error("DB error"),
      );

      const req = createRequest(
        `/api/client/group/chart-notes?clientGroupId=${clientGroupId}`,
      );
      const response = await getChartNotesHandler(req);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.message).toBe("Internal server error");
    });
  });

  // PUT /api/client/group/chart-notes/[chartNoteId]
  describe("PUT handler", () => {
    const chartNoteId = faker.string.uuid();
    const updateData = {
      text: "Updated text",
      note_date: faker.date.recent().toISOString(),
    };

    it("should update a chart note successfully", async () => {
      const updatedNote = mockChartNote({
        id: chartNoteId,
        text: updateData.text,
        note_date: new Date(updateData.note_date),
      });

      prismaMock.clientGroupChartNote.update.mockResolvedValueOnce(updatedNote);

      const req = createRequestWithBody(
        "/api/client/group/chart-notes/[chartNoteId]",
        updateData,
        { method: "PUT" },
      );
      const params = { chartNoteId };
      const response = await updateChartNoteHandler(req, { params });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.id).toBe(chartNoteId);
      expect(result.text).toBe(updateData.text);

      expect(prismaMock.clientGroupChartNote.update).toHaveBeenCalledWith({
        where: { id: chartNoteId },
        data: {
          text: updateData.text,
          note_date: new Date(updateData.note_date),
        },
      });
    });

    it("should return 400 if no fields to update", async () => {
      const req = createRequestWithBody(
        "/api/client/group/chart-notes/[chartNoteId]",
        {},
        { method: "PUT" },
      );
      const params = { chartNoteId };
      const response = await updateChartNoteHandler(req, { params });
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.message).toBe(
        "No fields to update. Provide text or note_date.",
      );
      expect(prismaMock.clientGroupChartNote.update).not.toHaveBeenCalled();
    });

    it("should return 404 if chart note not found (P2025 error)", async () => {
      const dbError = new Error("Record not found") as Error & {
        code?: string;
      };
      dbError.code = "P2025";
      prismaMock.clientGroupChartNote.update.mockRejectedValueOnce(dbError);

      const req = createRequestWithBody(
        "/api/client/group/chart-notes/[chartNoteId]",
        updateData,
        { method: "PUT" },
      );
      const params = { chartNoteId };
      const response = await updateChartNoteHandler(req, { params });
      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.message).toBe("Chart note not found.");
    });

    it("should return 500 for other database update errors", async () => {
      prismaMock.clientGroupChartNote.update.mockRejectedValueOnce(
        new Error("DB error"),
      );

      const req = createRequestWithBody(
        "/api/client/group/chart-notes/[chartNoteId]",
        updateData,
        { method: "PUT" },
      );
      const params = { chartNoteId };
      const response = await updateChartNoteHandler(req, { params });
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.message).toBe("Internal server error");
    });

    it("should return 400 for invalid JSON payload on update", async () => {
      const req = createRequest("/api/client/group/chart-notes/[chartNoteId]", {
        method: "PUT",
      });
      req.json = () => Promise.reject(new SyntaxError("Unexpected token"));

      const params = { chartNoteId };
      const response = await updateChartNoteHandler(req, { params });
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.message).toBe("Invalid JSON payload");
    });
  });

  // DELETE /api/client/group/chart-notes/[chartNoteId]
  describe("DELETE handler", () => {
    const chartNoteId = faker.string.uuid();

    it("should delete a chart note successfully", async () => {
      const deletedNote = mockChartNote({ id: chartNoteId });
      prismaMock.clientGroupChartNote.delete.mockResolvedValueOnce(deletedNote);

      const req = createRequest("/api/client/group/chart-notes/[chartNoteId]", {
        method: "DELETE",
      });
      const params = { chartNoteId };
      const response = await deleteChartNoteHandler(req, { params });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.message).toBe("Chart note deleted successfully.");

      expect(prismaMock.clientGroupChartNote.delete).toHaveBeenCalledWith({
        where: { id: chartNoteId },
      });
    });

    it("should return 404 if chart note not found (P2025 error)", async () => {
      const dbError = new Error("Record not found") as Error & {
        code?: string;
      };
      dbError.code = "P2025";
      prismaMock.clientGroupChartNote.delete.mockRejectedValueOnce(dbError);

      const req = createRequest("/api/client/group/chart-notes/[chartNoteId]", {
        method: "DELETE",
      });
      const params = { chartNoteId };
      const response = await deleteChartNoteHandler(req, { params });
      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.message).toBe("Chart note not found.");
    });

    it("should return 500 for other database delete errors", async () => {
      prismaMock.clientGroupChartNote.delete.mockRejectedValueOnce(
        new Error("DB error"),
      );

      const req = createRequest("/api/client/group/chart-notes/[chartNoteId]", {
        method: "DELETE",
      });
      const params = { chartNoteId };
      const response = await deleteChartNoteHandler(req, { params });
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.message).toBe("Internal server error");
    });
  });
});
