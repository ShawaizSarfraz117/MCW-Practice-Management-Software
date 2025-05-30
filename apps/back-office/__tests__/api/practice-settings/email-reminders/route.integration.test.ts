import {
  vi,
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
  afterAll,
} from "vitest";

// Mock logger before other imports
vi.mock("@mcw/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
  getDbLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    error: vi.fn(),
  }),
}));

import { createRequestWithBody } from "@mcw/utils";
import { prisma } from "@mcw/database";
import { GET, PUT } from "@/api/practice-settings/email-reminders/route";

describe("Email Reminder Settings API Routes (Integration)", () => {
  const EMAIL_REMINDERS_KEY = "reminder_emails_enabled";
  let settingId: string | null = null;

  // Clean up before tests
  beforeAll(async () => {
    // Delete any existing test settings
    await prisma.practiceSettings.deleteMany({
      where: { key: EMAIL_REMINDERS_KEY },
    });
  });

  // Clean up after tests
  afterAll(async () => {
    // Delete test settings
    await prisma.practiceSettings.deleteMany({
      where: { key: EMAIL_REMINDERS_KEY },
    });
  });

  beforeEach(async () => {
    // Reset any existing settings before each test
    await prisma.practiceSettings.deleteMany({
      where: { key: EMAIL_REMINDERS_KEY },
    });
    settingId = null;
  });

  describe("GET /api/practice-settings/email-reminders", () => {
    it("should return isReminderEmailsEnabled as true (default) when setting doesn't exist", async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ isReminderEmailsEnabled: true });
    });

    it("should return isReminderEmailsEnabled as true when setting exists and is 'true'", async () => {
      // Create setting in database
      const setting = await prisma.practiceSettings.create({
        data: {
          id: crypto.randomUUID(),
          key: EMAIL_REMINDERS_KEY,
          value: "true",
        },
      });
      settingId = setting.id;

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ isReminderEmailsEnabled: true });
    });

    it("should return isReminderEmailsEnabled as false when setting exists and is 'false'", async () => {
      // Create setting in database
      const setting = await prisma.practiceSettings.create({
        data: {
          id: crypto.randomUUID(),
          key: EMAIL_REMINDERS_KEY,
          value: "false",
        },
      });
      settingId = setting.id;

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ isReminderEmailsEnabled: false });
    });
  });

  describe("PUT /api/practice-settings/email-reminders", () => {
    it("should create setting when it doesn't exist", async () => {
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

      // Verify in database
      const setting = await prisma.practiceSettings.findFirst({
        where: { key: EMAIL_REMINDERS_KEY },
      });
      expect(setting).not.toBeNull();
      expect(setting?.value).toBe("true");
    });

    it("should update setting when it exists", async () => {
      // Create setting in database
      const setting = await prisma.practiceSettings.create({
        data: {
          id: crypto.randomUUID(),
          key: EMAIL_REMINDERS_KEY,
          value: "false",
        },
      });
      settingId = setting.id;

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

      // Verify in database
      const updatedSetting = await prisma.practiceSettings.findFirst({
        where: { id: settingId },
      });
      expect(updatedSetting).not.toBeNull();
      expect(updatedSetting?.value).toBe("true");
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
    });
  });
});
