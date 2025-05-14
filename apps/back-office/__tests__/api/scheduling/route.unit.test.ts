import { vi } from "vitest";
import { describe, it, expect, beforeEach } from "vitest";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { GET, PUT } from "@/api/scheduling/route";
import prismaMock from "@mcw/database/mock";
import { SchedulingMessageFactory } from "@mcw/database/mock-data";

describe("Scheduling Message API Unit Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("PUT /api/scheduling/[id] should update an existing message", async () => {
    const existingMessage = SchedulingMessageFactory.build();
    const updateData = {
      content: "Updated message content",
      type: "notification",
      isActive: true,
    };
    const updatedMessage = SchedulingMessageFactory.build({
      ...existingMessage,
      ...updateData,
    });

    prismaMock.schedulingMessage.findUnique.mockResolvedValueOnce(
      existingMessage,
    );
    prismaMock.schedulingMessage.update.mockResolvedValueOnce(updatedMessage);

    const req = createRequestWithBody("/api/scheduling/test-id", updateData, {
      method: "PUT",
    });
    const response = await PUT(req, { params: { id: "test-id" } });

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json.data).toMatchObject({
      id: updatedMessage.id,
      content: updateData.content,
      type: updateData.type,
      is_active: updateData.isActive,
    });

    expect(prismaMock.schedulingMessage.update).toHaveBeenCalledWith({
      where: { id: "test-id" },
      data: {
        content: updateData.content,
        type: updateData.type,
        is_active: updateData.isActive,
      },
    });
  });

  it("PUT /api/scheduling/[id] should return 400 for invalid message ID", async () => {
    const req = createRequestWithBody(
      "/api/scheduling/undefined",
      { content: "Test", type: "reminder" },
      { method: "PUT" },
    );
    const response = await PUT(req, { params: { id: "undefined" } });

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Invalid message ID");
  });

  it("PUT /api/scheduling/[id] should return 400 for missing required fields", async () => {
    const req = createRequestWithBody(
      "/api/scheduling/test-id",
      { content: "Test" }, // Missing type
      { method: "PUT" },
    );
    const response = await PUT(req, { params: { id: "test-id" } });

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Missing required fields");
  });

  it("GET /api/scheduling/[id] should return a message", async () => {
    const message = SchedulingMessageFactory.build();

    prismaMock.schedulingMessage.findUnique.mockResolvedValueOnce(message);

    const req = createRequest("/api/scheduling/test-id");
    const response = await GET(req, { params: { id: "test-id" } });

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json.data).toMatchObject({
      id: message.id,
      content: message.content,
      type: message.type,
      is_active: message.is_active,
    });

    expect(prismaMock.schedulingMessage.findUnique).toHaveBeenCalledWith({
      where: { id: "test-id" },
    });
  });

  it("GET /api/scheduling/[id] should return 400 for invalid message ID", async () => {
    const req = createRequest("/api/scheduling/undefined");
    const response = await GET(req, { params: { id: "undefined" } });

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Invalid message ID");
  });

  it("GET /api/scheduling/[id] should return 404 for non-existent message", async () => {
    prismaMock.schedulingMessage.findUnique.mockResolvedValueOnce(null);

    const req = createRequest("/api/scheduling/non-existent-id");
    const response = await GET(req, { params: { id: "non-existent-id" } });

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Message not found");
  });
});
