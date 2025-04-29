import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PUT } from "@/api/practiceInformation/route";
import { prisma } from "@mcw/database";
import { getBackOfficeSession } from "@/utils/helpers";
import { createRequestWithBody } from "@mcw/utils";

// Mock database
vi.mock("@mcw/database", () => ({
  prisma: {
    practiceInformation: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock helpers
vi.mock("@/utils/helpers", () => ({
  getBackOfficeSession: vi.fn(),
}));

describe("GET /api/practiceInformation", () => {
  const mockSession = {
    user: {
      id: "test-user-id",
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getBackOfficeSession).mockResolvedValue({
      ...mockSession,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    });
  });

  it("should return practice information", async () => {
    const mockPracticeInfo = {
      id: "1",
      user_id: mockSession.user.id,
      practice_name: "Test Practice",
      practice_email: "test@practice.com",
      time_zone: "UTC",
      practice_logo: "logo.png",
      phone_numbers: JSON.stringify([{ number: "123456789", type: "office" }]),
      tele_health: "true",
    };

    const mockFindFirst = prisma.practiceInformation
      .findFirst as unknown as ReturnType<typeof vi.fn>;
    mockFindFirst.mockResolvedValueOnce(mockPracticeInfo);

    const response = await GET();
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json).toMatchObject({
      ...mockPracticeInfo,
      phone_numbers: JSON.parse(mockPracticeInfo.phone_numbers),
    });
  });

  it("should return 401 if session is invalid", async () => {
    vi.mocked(getBackOfficeSession).mockResolvedValueOnce(null);

    const response = await GET();
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });

  it("should return 404 if practice information is not found", async () => {
    const mockFindFirst = prisma.practiceInformation
      .findFirst as unknown as ReturnType<typeof vi.fn>;
    mockFindFirst.mockResolvedValueOnce(null);

    const response = await GET();
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Practice information not found",
    });
  });

  it("should handle database errors", async () => {
    const mockFindFirst = prisma.practiceInformation
      .findFirst as unknown as ReturnType<typeof vi.fn>;
    mockFindFirst.mockRejectedValueOnce(new Error("Database error"));

    const response = await GET();
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to fetch practice information",
    });
  });
});

describe("PUT /api/practiceInformation", () => {
  const mockSession = {
    user: {
      id: "test-user-id",
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getBackOfficeSession).mockResolvedValue({
      ...mockSession,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    });
  });

  const validUpdateData = {
    practiceName: "Updated Practice",
    practiceEmail: "updated@practice.com",
    timeZone: "UTC",
    practiceLogo: "new-logo.png",
    phoneNumbers: [{ number: "987654321", type: "mobile" }],
    teleHealth: true,
  };

  it("should update practice information when record exists", async () => {
    // Mock findFirst to simulate existing record
    const mockFind = prisma.practiceInformation
      .findFirst as unknown as ReturnType<typeof vi.fn>;
    mockFind.mockResolvedValueOnce({
      id: "existing-id",
      user_id: mockSession.user.id,
    });

    // Mock updateMany to simulate successful update
    const mockUpdate = prisma.practiceInformation
      .updateMany as unknown as ReturnType<typeof vi.fn>;
    mockUpdate.mockResolvedValueOnce({ count: 1 });

    const request = createRequestWithBody(
      "/api/practiceInformation",
      validUpdateData,
    );
    const response = await PUT(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({ count: 1 });

    // Verify correct data was passed to update
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { user_id: mockSession.user.id },
      data: {
        practice_name: validUpdateData.practiceName,
        practice_email: validUpdateData.practiceEmail,
        time_zone: validUpdateData.timeZone,
        practice_logo: validUpdateData.practiceLogo,
        phone_numbers: JSON.stringify(validUpdateData.phoneNumbers),
      },
    });
  });

  it("should create new practice information when record does not exist", async () => {
    // Mock findFirst to simulate no existing record
    const mockFind = prisma.practiceInformation
      .findFirst as unknown as ReturnType<typeof vi.fn>;
    mockFind.mockResolvedValueOnce(null);

    const mockCreate = prisma.practiceInformation
      .create as unknown as ReturnType<typeof vi.fn>;
    const expectedNewRecord = {
      id: "new-id",
      user_id: mockSession.user.id,
      practice_name: validUpdateData.practiceName,
      practice_email: validUpdateData.practiceEmail,
      time_zone: validUpdateData.timeZone,
      practice_logo: validUpdateData.practiceLogo,
      phone_numbers: JSON.stringify(validUpdateData.phoneNumbers),
      tele_health: "true",
    };
    mockCreate.mockResolvedValueOnce(expectedNewRecord);

    const request = createRequestWithBody(
      "/api/practiceInformation",
      validUpdateData,
    );
    const response = await PUT(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual(expectedNewRecord);
  });

  it("should return 401 if session is missing", async () => {
    vi.mocked(getBackOfficeSession).mockResolvedValueOnce(null);

    const request = createRequestWithBody(
      "/api/practiceInformation",
      validUpdateData,
    );
    const response = await PUT(request);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });

  it("should return 422 for invalid input data", async () => {
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
  });

  it("should handle database errors during update", async () => {
    const mockFind = prisma.practiceInformation
      .findFirst as unknown as ReturnType<typeof vi.fn>;
    mockFind.mockResolvedValueOnce({
      id: "existing-id",
      user_id: mockSession.user.id,
    });

    const mockUpdate = prisma.practiceInformation
      .updateMany as unknown as ReturnType<typeof vi.fn>;
    mockUpdate.mockRejectedValueOnce(new Error("Database error"));

    const request = createRequestWithBody(
      "/api/practiceInformation",
      validUpdateData,
    );
    const response = await PUT(request);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to update practice information",
    });
  });

  it("should handle database errors during create", async () => {
    const mockFind = prisma.practiceInformation
      .findFirst as unknown as ReturnType<typeof vi.fn>;
    mockFind.mockResolvedValueOnce(null);

    const mockCreate = prisma.practiceInformation
      .create as unknown as ReturnType<typeof vi.fn>;
    mockCreate.mockRejectedValueOnce(new Error("Database error"));

    const request = createRequestWithBody(
      "/api/practiceInformation",
      validUpdateData,
    );
    const response = await PUT(request);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to update practice information",
    });
  });
});
