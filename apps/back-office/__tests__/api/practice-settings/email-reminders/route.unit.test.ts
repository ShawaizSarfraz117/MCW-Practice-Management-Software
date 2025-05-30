import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock the modules before importing
vi.mock("@mcw/database", () => ({
  prisma: {
    practiceSettings: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@mcw/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Now import the modules that use the mocks
import { GET, PUT } from "@/api/practice-settings/email-reminders/route";
import { createRequestWithBody } from "@mcw/utils";
import { prisma } from "@mcw/database";

// Mock crypto.randomUUID
const mockUUID = "test-uuid-1234";
vi.stubGlobal("crypto", {
  randomUUID: () => mockUUID,
});

describe("Email Reminder Settings API Routes", () => {
  const EMAIL_REMINDERS_KEY = "reminder_emails_enabled";

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("GET /api/practice-settings/email-reminders", () => {
    it("should return isReminderEmailsEnabled as true when setting exists and is 'true'", async () => {
      // Mock database response
      vi.mocked(prisma.practiceSettings.findFirst).mockResolvedValueOnce({
        id: "1",
        key: EMAIL_REMINDERS_KEY,
        value: "true",
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ isReminderEmailsEnabled: true });
      expect(prisma.practiceSettings.findFirst).toHaveBeenCalledWith({
        where: { key: EMAIL_REMINDERS_KEY },
      });
    });

    it("should return isReminderEmailsEnabled as false when setting exists and is 'false'", async () => {
      // Mock database response
      vi.mocked(prisma.practiceSettings.findFirst).mockResolvedValueOnce({
        id: "1",
        key: EMAIL_REMINDERS_KEY,
        value: "false",
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ isReminderEmailsEnabled: false });
      expect(prisma.practiceSettings.findFirst).toHaveBeenCalledWith({
        where: { key: EMAIL_REMINDERS_KEY },
      });
    });

    it("should return isReminderEmailsEnabled as true (default) when setting doesn't exist", async () => {
      // Mock database response for non-existent setting
      vi.mocked(prisma.practiceSettings.findFirst).mockResolvedValueOnce(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ isReminderEmailsEnabled: true });
      expect(prisma.practiceSettings.findFirst).toHaveBeenCalledWith({
        where: { key: EMAIL_REMINDERS_KEY },
      });
    });

    it("should handle database errors and return 500", async () => {
      // Mock database error
      vi.mocked(prisma.practiceSettings.findFirst).mockRejectedValueOnce(
        new Error("Database error"),
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: "Failed to fetch email reminder settings",
      });
      expect(prisma.practiceSettings.findFirst).toHaveBeenCalledWith({
        where: { key: EMAIL_REMINDERS_KEY },
      });
    });
  });

  describe("PUT /api/practice-settings/email-reminders", () => {
    it("should update setting to true when it exists", async () => {
      // Mock database responses
      vi.mocked(prisma.practiceSettings.findFirst).mockResolvedValueOnce({
        id: "1",
        key: EMAIL_REMINDERS_KEY,
        value: "false",
      });
      vi.mocked(prisma.practiceSettings.update).mockResolvedValueOnce({
        id: "1",
        key: EMAIL_REMINDERS_KEY,
        value: "true",
      });

      const request = createRequestWithBody(
        "/api/practice-settings/email-reminders",
        { isReminderEmailsEnabled: true },
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        isReminderEmailsEnabled: true,
        message: "Email reminder settings updated successfully",
      });
      expect(prisma.practiceSettings.findFirst).toHaveBeenCalledWith({
        where: { key: EMAIL_REMINDERS_KEY },
      });
      expect(prisma.practiceSettings.update).toHaveBeenCalledWith({
        where: { id: "1" },
        data: { value: "true" },
      });
    });

    it("should update setting to false when it exists", async () => {
      // Mock database responses
      vi.mocked(prisma.practiceSettings.findFirst).mockResolvedValueOnce({
        id: "1",
        key: EMAIL_REMINDERS_KEY,
        value: "true",
      });
      vi.mocked(prisma.practiceSettings.update).mockResolvedValueOnce({
        id: "1",
        key: EMAIL_REMINDERS_KEY,
        value: "false",
      });

      const request = createRequestWithBody(
        "/api/practice-settings/email-reminders",
        { isReminderEmailsEnabled: false },
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        isReminderEmailsEnabled: false,
        message: "Email reminder settings updated successfully",
      });
      expect(prisma.practiceSettings.findFirst).toHaveBeenCalledWith({
        where: { key: EMAIL_REMINDERS_KEY },
      });
      expect(prisma.practiceSettings.update).toHaveBeenCalledWith({
        where: { id: "1" },
        data: { value: "false" },
      });
    });

    it("should create setting when it doesn't exist", async () => {
      // Mock database responses
      vi.mocked(prisma.practiceSettings.findFirst).mockResolvedValueOnce(null);
      vi.mocked(prisma.practiceSettings.create).mockResolvedValueOnce({
        id: mockUUID,
        key: EMAIL_REMINDERS_KEY,
        value: "true",
      });

      const request = createRequestWithBody(
        "/api/practice-settings/email-reminders",
        { isReminderEmailsEnabled: true },
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        isReminderEmailsEnabled: true,
        message: "Email reminder settings updated successfully",
      });
      expect(prisma.practiceSettings.findFirst).toHaveBeenCalledWith({
        where: { key: EMAIL_REMINDERS_KEY },
      });
      expect(prisma.practiceSettings.create).toHaveBeenCalledWith({
        data: {
          id: mockUUID,
          key: EMAIL_REMINDERS_KEY,
          value: "true",
        },
      });
    });

    it("should return 400 for invalid input (non-boolean)", async () => {
      const request = createRequestWithBody(
        "/api/practice-settings/email-reminders",
        { isReminderEmailsEnabled: "not-a-boolean" },
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: "isReminderEmailsEnabled must be a boolean value",
      });
      expect(prisma.practiceSettings.findFirst).not.toHaveBeenCalled();
      expect(prisma.practiceSettings.create).not.toHaveBeenCalled();
      expect(prisma.practiceSettings.update).not.toHaveBeenCalled();
    });

    it("should handle database errors and return 500", async () => {
      // Mock database error
      vi.mocked(prisma.practiceSettings.findFirst).mockRejectedValueOnce(
        new Error("Database error"),
      );

      const request = createRequestWithBody(
        "/api/practice-settings/email-reminders",
        { isReminderEmailsEnabled: true },
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: "Failed to update email reminder settings",
      });
      expect(prisma.practiceSettings.findFirst).toHaveBeenCalledWith({
        where: { key: EMAIL_REMINDERS_KEY },
      });
    });
  });
});
