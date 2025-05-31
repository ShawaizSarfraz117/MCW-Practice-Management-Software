import { vi, describe, it, expect, beforeEach } from "vitest";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { GET, PUT } from "@/api/practice-settings/route";
import prismaMock from "@mcw/database/mock";

// Mock the authentication helper
vi.mock("@/utils/helpers", () => ({
  getBackOfficeSession: vi.fn(() =>
    Promise.resolve({
      user: {
        id: "test-user-id",
      },
    }),
  ),
}));

describe("Practice Settings API Unit Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("GET /api/practice-settings", () => {
    it("should return all practice settings when no keys parameter provided", async () => {
      const mockSettings = [
        { id: "1", key: "is-text-reminders-enabled", value: "true" },
        { id: "2", key: "reminder-duration", value: "24h" },
        { id: "3", key: "other-setting", value: "test-value" },
      ];

      prismaMock.practiceSettings.findMany.mockResolvedValueOnce(mockSettings);

      const request = createRequest("/api/practice-settings");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();

      expect(json).toEqual({
        "is-text-reminders-enabled": true,
        "reminder-duration": "24h",
        "other-setting": "test-value",
      });

      expect(prismaMock.practiceSettings.findMany).toHaveBeenCalledWith({
        where: {},
      });
    });

    it("should return filtered practice settings when keys parameter provided", async () => {
      const mockSettings = [
        { id: "1", key: "is-text-reminders-enabled", value: "true" },
        { id: "2", key: "reminder-duration", value: "30m" },
      ];

      prismaMock.practiceSettings.findMany.mockResolvedValueOnce(mockSettings);

      const request = createRequest(
        "/api/practice-settings?keys=is-text-reminders-enabled,reminder-duration",
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();

      expect(json).toEqual({
        "is-text-reminders-enabled": true,
        "reminder-duration": "30m",
      });

      expect(prismaMock.practiceSettings.findMany).toHaveBeenCalledWith({
        where: {
          key: {
            in: ["is-text-reminders-enabled", "reminder-duration"],
          },
        },
      });
    });

    it("should handle JSON values correctly", async () => {
      const mockSettings = [
        {
          id: "1",
          key: "complex-setting",
          value: '{"nested": true, "count": 42}',
        },
        { id: "2", key: "boolean-setting", value: "false" },
        { id: "3", key: "string-setting", value: "simple-string" },
      ];

      prismaMock.practiceSettings.findMany.mockResolvedValueOnce(mockSettings);

      const request = createRequest("/api/practice-settings");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();

      expect(json).toEqual({
        "complex-setting": { nested: true, count: 42 },
        "boolean-setting": false,
        "string-setting": "simple-string",
      });
    });

    it("should return empty object when no settings found", async () => {
      prismaMock.practiceSettings.findMany.mockResolvedValueOnce([]);

      const request = createRequest("/api/practice-settings");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual({});
    });

    it("should return 401 when user is not authenticated", async () => {
      const { getBackOfficeSession } = await import("@/utils/helpers");
      vi.mocked(getBackOfficeSession).mockResolvedValueOnce(null);

      const request = createRequest("/api/practice-settings");
      const response = await GET(request);

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ error: "Unauthorized" });
    });

    it("should return 500 when database operation fails", async () => {
      prismaMock.practiceSettings.findMany.mockRejectedValueOnce(
        new Error("Database error"),
      );

      const request = createRequest("/api/practice-settings");
      const response = await GET(request);

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json).toEqual({ error: "Failed to fetch practice settings" });
    });
  });

  describe("PUT /api/practice-settings", () => {
    it("should create new practice settings", async () => {
      const settingsData = {
        "is-text-reminders-enabled": true,
        "reminder-duration": "2h",
      };

      // Mock no existing settings
      prismaMock.practiceSettings.findFirst.mockResolvedValueOnce(null);
      prismaMock.practiceSettings.create.mockResolvedValue({
        id: "new-id",
        key: "is-text-reminders-enabled",
        value: "true",
      });

      const request = createRequestWithBody(
        "/api/practice-settings",
        settingsData,
        { method: "PUT" },
      );
      const response = await PUT(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual({
        success: true,
        updated: ["is-text-reminders-enabled", "reminder-duration"],
      });

      expect(prismaMock.practiceSettings.findFirst).toHaveBeenCalledTimes(2);
      expect(prismaMock.practiceSettings.create).toHaveBeenCalledTimes(2);
      expect(prismaMock.practiceSettings.create).toHaveBeenCalledWith({
        data: {
          id: expect.any(String),
          key: "is-text-reminders-enabled",
          value: "true",
        },
      });
    });

    it("should update existing practice settings", async () => {
      const settingsData = {
        "is-text-reminders-enabled": false,
        "reminder-duration": "1h",
      };

      const existingSetting1 = {
        id: "existing-1",
        key: "is-text-reminders-enabled",
        value: "true",
      };
      const existingSetting2 = {
        id: "existing-2",
        key: "reminder-duration",
        value: "24h",
      };

      prismaMock.practiceSettings.findFirst
        .mockResolvedValueOnce(existingSetting1)
        .mockResolvedValueOnce(existingSetting2);

      prismaMock.practiceSettings.update.mockResolvedValue({
        id: "existing-1",
        key: "is-text-reminders-enabled",
        value: "false",
      });

      const request = createRequestWithBody(
        "/api/practice-settings",
        settingsData,
        { method: "PUT" },
      );
      const response = await PUT(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual({
        success: true,
        updated: ["is-text-reminders-enabled", "reminder-duration"],
      });

      expect(prismaMock.practiceSettings.update).toHaveBeenCalledTimes(2);
      expect(prismaMock.practiceSettings.update).toHaveBeenCalledWith({
        where: { id: "existing-1" },
        data: { value: "false" },
      });
    });

    it("should handle complex object values", async () => {
      const settingsData = {
        "complex-setting": { nested: true, count: 42 },
        "simple-setting": "test",
      };

      prismaMock.practiceSettings.findFirst.mockResolvedValue(null);

      // Mock the create calls to return what would actually be stored
      prismaMock.practiceSettings.create
        .mockResolvedValueOnce({
          id: "complex-id",
          key: "complex-setting",
          value: JSON.stringify({ nested: true, count: 42 }), // This is what should be stored
        })
        .mockResolvedValueOnce({
          id: "simple-id",
          key: "simple-setting",
          value: "test",
        });

      const request = createRequestWithBody(
        "/api/practice-settings",
        settingsData,
        { method: "PUT" },
      );
      const response = await PUT(request);

      expect(response.status).toBe(200);

      // Verify create was called twice (once for each setting)
      expect(prismaMock.practiceSettings.create).toHaveBeenCalledTimes(2);

      // Get all the create calls
      const createCalls = prismaMock.practiceSettings.create.mock.calls;

      // Verify that both settings were processed
      const keys = createCalls.map((call) => call[0].data.key);
      expect(keys).toContain("complex-setting");
      expect(keys).toContain("simple-setting");

      // Find the complex setting call and verify the value being passed to create
      const complexSettingCall = createCalls.find(
        (call) => call[0].data.key === "complex-setting",
      );
      expect(complexSettingCall).toBeDefined();

      if (complexSettingCall) {
        const value = complexSettingCall[0].data.value;
        console.log("Value being stored:", value);

        // The value should be the JSON stringified version
        expect(value).toBe('{"nested":true,"count":42}');

        // Verify it can be parsed back
        const parsedValue = JSON.parse(value);
        expect(parsedValue).toEqual({ nested: true, count: 42 });
      }
    });

    it("should return 422 for invalid request payload", async () => {
      const invalidData = {
        "": "empty-key-invalid",
        "valid-key": null, // This might be invalid depending on Zod schema
      };

      const request = createRequestWithBody(
        "/api/practice-settings",
        invalidData,
        { method: "PUT" },
      );
      const response = await PUT(request);

      expect(response.status).toBe(422);
      const json = await response.json();
      expect(json).toHaveProperty("error", "Invalid request payload");
      expect(json).toHaveProperty("details");
    });

    it("should return 401 when user is not authenticated", async () => {
      const { getBackOfficeSession } = await import("@/utils/helpers");
      vi.mocked(getBackOfficeSession).mockResolvedValueOnce(null);

      const settingsData = {
        "is-text-reminders-enabled": true,
      };

      const request = createRequestWithBody(
        "/api/practice-settings",
        settingsData,
        { method: "PUT" },
      );
      const response = await PUT(request);

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ error: "Unauthorized" });
    });

    it("should return 500 when database operation fails", async () => {
      const settingsData = {
        "is-text-reminders-enabled": true,
      };

      prismaMock.practiceSettings.findFirst.mockRejectedValueOnce(
        new Error("Database error"),
      );

      const request = createRequestWithBody(
        "/api/practice-settings",
        settingsData,
        { method: "PUT" },
      );
      const response = await PUT(request);

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json).toEqual({ error: "Failed to update practice settings" });
    });

    it("should handle mixed create and update operations", async () => {
      const settingsData = {
        "existing-setting": "updated-value",
        "new-setting": "new-value",
      };

      // First setting exists, second doesn't
      prismaMock.practiceSettings.findFirst
        .mockResolvedValueOnce({
          id: "existing-1",
          key: "existing-setting",
          value: "old-value",
        })
        .mockResolvedValueOnce(null);

      prismaMock.practiceSettings.update.mockResolvedValueOnce({
        id: "existing-1",
        key: "existing-setting",
        value: "updated-value",
      });

      prismaMock.practiceSettings.create.mockResolvedValueOnce({
        id: "new-1",
        key: "new-setting",
        value: "new-value",
      });

      const request = createRequestWithBody(
        "/api/practice-settings",
        settingsData,
        { method: "PUT" },
      );
      const response = await PUT(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual({
        success: true,
        updated: ["existing-setting", "new-setting"],
      });

      expect(prismaMock.practiceSettings.update).toHaveBeenCalledTimes(1);
      expect(prismaMock.practiceSettings.create).toHaveBeenCalledTimes(1);
    });
  });
});
