import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from "vitest";
import { GET, PUT } from "@/api/practiceInformation/route";
import { prisma } from "@mcw/database";
import { getBackOfficeSession } from "@/utils/helpers";
import { createRequestWithBody } from "@mcw/utils";
import { UserFactory } from "@mcw/database/mock-data";

// Create mock user data
const mockUser = UserFactory.build();

// Mock helpers
vi.mock("@/utils/helpers", () => ({
  getBackOfficeSession: vi.fn(),
}));

describe("Practice Information API Integration Tests", () => {
  const mockSession = {
    user: {
      id: mockUser.id,
    },
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
  };

  beforeAll(async () => {
    // Create test user in database
    await prisma.user.create({
      data: mockUser,
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.practiceInformation.deleteMany({
      where: { user_id: mockUser.id },
    });
    await prisma.user.deleteMany({
      where: { id: mockUser.id },
    });
  });

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getBackOfficeSession).mockResolvedValue(mockSession);
  });

  describe("GET /api/practiceInformation", () => {
    it("should return 404 when no practice information exists", async () => {
      // Ensure no practice information exists
      await prisma.practiceInformation.deleteMany({
        where: { user_id: mockUser.id },
      });

      const response = await GET();
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({
        error: "Practice information not found",
      });
    });

    it("should return practice information when it exists", async () => {
      const practiceInfo = {
        user_id: mockUser.id,
        practice_name: "Test Practice",
        practice_email: "test@example.com",
        time_zone: "UTC",
        practice_logo: "logo.png",
        phone_numbers: JSON.stringify([
          { number: "123456789", type: "office" },
        ]),
        tele_health: true,
      };

      await prisma.practiceInformation.create({
        data: practiceInfo,
      });

      const response = await GET();
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json).toMatchObject({
        ...practiceInfo,
        phone_numbers: JSON.parse(practiceInfo.phone_numbers),
      });

      // Clean up
      await prisma.practiceInformation.deleteMany({
        where: { user_id: mockUser.id },
      });
    });
  });

  describe("PUT /api/practiceInformation", () => {
    const validData = {
      practiceName: "Updated Practice",
      practiceEmail: "updated@example.com",
      timeZone: "America/New_York",
      practiceLogo: "new-logo.png",
      phoneNumbers: [{ number: "987654321", type: "mobile" }],
      teleHealth: true,
    };

    beforeEach(async () => {
      // Clean up any existing practice information
      await prisma.practiceInformation.deleteMany({
        where: { user_id: mockUser.id },
      });
    });

    it("should create new practice information when none exists", async () => {
      const request = createRequestWithBody(
        "/api/practiceInformation",
        validData,
      );
      const response = await PUT(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json).toMatchObject({
        user_id: mockUser.id,
        practice_name: validData.practiceName,
        practice_email: validData.practiceEmail,
        time_zone: validData.timeZone,
        practice_logo: validData.practiceLogo,
        phone_numbers: JSON.stringify(validData.phoneNumbers),
        tele_health: true,
      });

      // Verify in database
      const dbRecord = await prisma.practiceInformation.findFirst({
        where: { user_id: mockUser.id },
      });
      expect(dbRecord).toBeTruthy();
      expect(dbRecord?.practice_name).toBe(validData.practiceName);
    });

    it("should update existing practice information", async () => {
      // First create initial record
      const initialData = {
        user_id: mockUser.id,
        practice_name: "Initial Practice",
        practice_email: "initial@example.com",
        time_zone: "UTC",
        practice_logo: "initial-logo.png",
        phone_numbers: JSON.stringify([
          { number: "123456789", type: "office" },
        ]),
        tele_health: false,
      };

      await prisma.practiceInformation.create({
        data: initialData,
      });

      // Then update it
      const request = createRequestWithBody(
        "/api/practiceInformation",
        validData,
      );
      const response = await PUT(request);
      expect(response.status).toBe(200);

      // Verify in database
      const dbRecord = await prisma.practiceInformation.findFirst({
        where: { user_id: mockUser.id },
      });
      expect(dbRecord).toBeTruthy();
      expect(dbRecord?.practice_name).toBe(validData.practiceName);
      expect(dbRecord?.practice_email).toBe(validData.practiceEmail);
      expect(JSON.parse(dbRecord?.phone_numbers || "[]")).toEqual(
        validData.phoneNumbers,
      );
    });

    it("should handle partial updates", async () => {
      // First create initial record
      const initialData = {
        user_id: mockUser.id,
        practice_name: "Initial Practice",
        practice_email: "initial@example.com",
        time_zone: "UTC",
        practice_logo: "initial-logo.png",
        phone_numbers: JSON.stringify([
          { number: "123456789", type: "office" },
        ]),
        tele_health: false,
      };

      await prisma.practiceInformation.create({
        data: initialData,
      });

      // Update only practice name
      const partialData = {
        practiceName: "Updated Practice Name",
        practiceEmail: "initial@example.com",
        timeZone: "UTC",
        practiceLogo: "initial-logo.png",
        phoneNumbers: [{ number: "123456789", type: "office" }],
        teleHealth: false,
      };

      const request = createRequestWithBody(
        "/api/practiceInformation",
        partialData,
      );
      const response = await PUT(request);
      expect(response.status).toBe(200);

      // Verify in database
      const dbRecord = await prisma.practiceInformation.findFirst({
        where: { user_id: mockUser.id },
      });
      expect(dbRecord).toBeTruthy();
      expect(dbRecord?.practice_name).toBe(partialData.practiceName);
      expect(dbRecord?.practice_email).toBe(partialData.practiceEmail);
      expect(dbRecord?.time_zone).toBe(partialData.timeZone);
      expect(dbRecord?.practice_logo).toBe(partialData.practiceLogo);
      expect(JSON.parse(dbRecord?.phone_numbers || "[]")).toEqual(
        partialData.phoneNumbers,
      );
    });

    it("should validate input data", async () => {
      const invalidData = {
        practiceName: "x".repeat(101), // Exceeds max length
        practiceEmail: "not-an-email",
        phoneNumbers: "not-an-array", // Should be an array
      };

      const request = createRequestWithBody(
        "/api/practiceInformation",
        invalidData,
      );
      const response = await PUT(request);
      expect(response.status).toBe(422);

      const json = await response.json();
      expect(json.error).toBe("Invalid request payload");
      expect(json.details).toBeDefined();

      // Verify nothing was created in database
      const dbRecord = await prisma.practiceInformation.findFirst({
        where: { user_id: mockUser.id },
      });
      expect(dbRecord).toBeNull();
    });

    it("should handle unauthorized access", async () => {
      vi.mocked(getBackOfficeSession).mockResolvedValueOnce(null);

      const request = createRequestWithBody(
        "/api/practiceInformation",
        validData,
      );
      const response = await PUT(request);
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: "Unauthorized" });

      // Verify nothing was created in database
      const dbRecord = await prisma.practiceInformation.findFirst({
        where: { user_id: mockUser.id },
      });
      expect(dbRecord).toBeNull();
    });
  });
});
