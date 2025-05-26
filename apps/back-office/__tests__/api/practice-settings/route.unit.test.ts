import { describe, it, expect, beforeEach, vi } from "vitest";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { GET, PUT } from "@/api/practice-settings/route";
import prismaMock from "@mcw/database/mock";

// Mock crypto.randomUUID for consistent testing
vi.stubGlobal("crypto", {
  randomUUID: () => "test-uuid-123",
});

// Mock logger to prevent test output pollution
vi.mock("@mcw/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("Practice Settings API", () => {
  const mockSettings = [
    {
      id: "setting1-id",
      key: "timezone",
      value: "America/New_York",
    },
    {
      id: "setting2-id",
      key: "dateFormat",
      value: "MM/DD/YYYY",
    },
    {
      id: "setting3-id",
      key: "enableEmailNotifications",
      value: "true",
    },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("GET /api/practice-settings", () => {
    it("should get practice settings as an object", async () => {
      prismaMock.practiceSettings.findMany.mockResolvedValueOnce(mockSettings);

      const req = createRequest("/api/practice-settings");
      const response = await GET(req);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual({
        timezone: "America/New_York",
        dateFormat: "MM/DD/YYYY",
        enableEmailNotifications: "true",
      });

      expect(prismaMock.practiceSettings.findMany).toHaveBeenCalled();
    });

    it("should return an empty object if no settings exist", async () => {
      prismaMock.practiceSettings.findMany.mockResolvedValueOnce([]);

      const req = createRequest("/api/practice-settings");
      const response = await GET(req);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual({});

      expect(prismaMock.practiceSettings.findMany).toHaveBeenCalled();
    });

    it("should handle database errors", async () => {
      prismaMock.practiceSettings.findMany.mockRejectedValueOnce(
        new Error("Database error"),
      );

      const req = createRequest("/api/practice-settings");
      const response = await GET(req);

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json).toHaveProperty("error", "Failed to fetch practice settings");
    });
  });

  describe("PUT /api/practice-settings", () => {
    it("should update existing settings", async () => {
      const updateData = {
        timezone: "America/Los_Angeles",
        dateFormat: "YYYY-MM-DD",
      };

      // Mock the findFirst for each key
      prismaMock.practiceSettings.findFirst
        .mockResolvedValueOnce({
          id: "setting1-id",
          key: "timezone",
          value: "America/New_York",
        })
        .mockResolvedValueOnce({
          id: "setting2-id",
          key: "dateFormat",
          value: "MM/DD/YYYY",
        });

      // Mock the update for each key
      prismaMock.practiceSettings.update
        .mockResolvedValueOnce({
          id: "setting1-id",
          key: "timezone",
          value: "America/Los_Angeles",
        })
        .mockResolvedValueOnce({
          id: "setting2-id",
          key: "dateFormat",
          value: "YYYY-MM-DD",
        });

      const req = createRequestWithBody("/api/practice-settings", updateData, {
        method: "PUT",
      });
      const response = await PUT(req);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toHaveProperty(
        "message",
        "Practice settings updated successfully",
      );
      expect(json).toHaveProperty("settings");
      expect(json.settings).toHaveLength(2);
      expect(json.settings[0]).toEqual({
        id: "setting1-id",
        key: "timezone",
        value: "America/Los_Angeles",
      });
      expect(json.settings[1]).toEqual({
        id: "setting2-id",
        key: "dateFormat",
        value: "YYYY-MM-DD",
      });

      expect(prismaMock.practiceSettings.findFirst).toHaveBeenCalledTimes(2);
      expect(prismaMock.practiceSettings.update).toHaveBeenCalledTimes(2);
      expect(prismaMock.practiceSettings.update).toHaveBeenCalledWith({
        where: { id: "setting1-id" },
        data: { value: "America/Los_Angeles" },
      });
      expect(prismaMock.practiceSettings.update).toHaveBeenCalledWith({
        where: { id: "setting2-id" },
        data: { value: "YYYY-MM-DD" },
      });
    });

    it("should create new settings if they don't exist", async () => {
      const newData = {
        newSetting: "value1",
        anotherNewSetting: "value2",
      };

      // Mock the findFirst for each key to return null (not found)
      prismaMock.practiceSettings.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      // Mock the create for each key
      prismaMock.practiceSettings.create
        .mockResolvedValueOnce({
          id: "test-uuid-123",
          key: "newSetting",
          value: "value1",
        })
        .mockResolvedValueOnce({
          id: "test-uuid-123",
          key: "anotherNewSetting",
          value: "value2",
        });

      const req = createRequestWithBody("/api/practice-settings", newData, {
        method: "PUT",
      });
      const response = await PUT(req);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toHaveProperty(
        "message",
        "Practice settings updated successfully",
      );
      expect(json).toHaveProperty("settings");
      expect(json.settings).toHaveLength(2);
      expect(json.settings[0]).toEqual({
        id: "test-uuid-123",
        key: "newSetting",
        value: "value1",
      });
      expect(json.settings[1]).toEqual({
        id: "test-uuid-123",
        key: "anotherNewSetting",
        value: "value2",
      });

      expect(prismaMock.practiceSettings.findFirst).toHaveBeenCalledTimes(2);
      expect(prismaMock.practiceSettings.create).toHaveBeenCalledTimes(2);
      expect(prismaMock.practiceSettings.create).toHaveBeenCalledWith({
        data: {
          id: "test-uuid-123",
          key: "newSetting",
          value: "value1",
        },
      });
      expect(prismaMock.practiceSettings.create).toHaveBeenCalledWith({
        data: {
          id: "test-uuid-123",
          key: "anotherNewSetting",
          value: "value2",
        },
      });
    });

    it("should return 400 for invalid input (not an object)", async () => {
      // Use explicit casting to fix type error
      const invalidData = "not an object" as unknown as Record<string, unknown>;

      const req = createRequestWithBody("/api/practice-settings", invalidData, {
        method: "PUT",
      });
      const response = await PUT(req);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty("error", "Invalid input");
      expect(json).toHaveProperty(
        "details",
        "Request body must be an object with key-value pairs",
      );
    });

    it("should return 400 for invalid input (non-string value)", async () => {
      const invalidData = {
        validKey: "valid string",
        invalidKey: { nested: "object" },
      };

      const req = createRequestWithBody("/api/practice-settings", invalidData, {
        method: "PUT",
      });
      const response = await PUT(req);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty("error", "Invalid input");
      expect(json).toHaveProperty(
        "details",
        "Value for key 'invalidKey' must be a string",
      );
    });

    it("should handle database errors during update", async () => {
      const updateData = {
        timezone: "UTC",
      };

      prismaMock.practiceSettings.findFirst.mockResolvedValueOnce({
        id: "setting1-id",
        key: "timezone",
        value: "America/New_York",
      });
      prismaMock.practiceSettings.update.mockRejectedValueOnce(
        new Error("Database error"),
      );

      const req = createRequestWithBody("/api/practice-settings", updateData, {
        method: "PUT",
      });
      const response = await PUT(req);

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json).toHaveProperty(
        "error",
        "Failed to update practice settings",
      );
    });
  });
});
