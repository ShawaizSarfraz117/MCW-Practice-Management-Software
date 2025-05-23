import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PUT } from "@/api/practiceInformation/route";
import prismaMock from "@mcw/database/mock";
import { getBackOfficeSession } from "@/utils/helpers";
import { createRequestWithBody } from "@mcw/utils";
import * as helpers from "@/utils/helpers";

// Mock helpers
vi.mock("@/utils/helpers", () => ({
  getBackOfficeSession: vi.fn(),
  getClinicianInfo: vi.fn(),
}));

const mockClinicianId = "mock-clinician-id";

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
    vi.mocked(helpers.getClinicianInfo).mockResolvedValue({
      isClinician: true,
      clinicianId: mockClinicianId,
      clinician: { id: mockClinicianId, first_name: "Test", last_name: "User" },
    });
  });

  it("should return practice information", async () => {
    const mockPracticeInfo = {
      id: "1",
      clinician_id: mockClinicianId,
      practice_name: "Test Practice",
      practice_email: "test@practice.com",
      time_zone: "UTC",
      practice_logo: "logo.png",
      phone_numbers: JSON.stringify([{ number: "123456789", type: "office" }]),
      tele_health: true,
    };

    const mockFindFirst = prismaMock.practiceInformation
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
    const mockFindFirst = prismaMock.practiceInformation
      .findFirst as unknown as ReturnType<typeof vi.fn>;
    mockFindFirst.mockResolvedValueOnce(null);

    const response = await GET();
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Practice information not found",
    });
  });

  it("should handle database errors", async () => {
    const mockFindFirst = prismaMock.practiceInformation
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
    vi.mocked(helpers.getClinicianInfo).mockResolvedValue({
      isClinician: true,
      clinicianId: mockClinicianId,
      clinician: { id: mockClinicianId, first_name: "Test", last_name: "User" },
    });
  });

  const validUpdateData = {
    practiceName: "Updated Practice",
    practiceEmail: "updated@practice.com",
    timeZone: "UTC",
    practiceLogo: "new-logo.png",
    phoneNumbers: [{ number: "987654321", type: "mobile" }],
    tele_health: false,
  };

  it("should update practice information when record exists", async () => {
    // Mock findFirst to simulate existing record
    const mockFind = prismaMock.practiceInformation
      .findFirst as unknown as ReturnType<typeof vi.fn>;
    mockFind.mockResolvedValueOnce({
      id: "existing-id",
      clinician_id: mockClinicianId,
    });

    // Mock updateMany to simulate successful update
    const mockUpdate = prismaMock.practiceInformation
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
      where: { clinician_id: mockClinicianId },
      data: {
        practice_name: validUpdateData.practiceName,
        practice_email: validUpdateData.practiceEmail,
        time_zone: validUpdateData.timeZone,
        practice_logo: validUpdateData.practiceLogo,
        phone_numbers: JSON.stringify(validUpdateData.phoneNumbers),
        tele_health: validUpdateData.tele_health,
      },
    });
  });

  it("should create new practice information when record does not exist", async () => {
    // Mock findFirst to simulate no existing record
    const mockFind = prismaMock.practiceInformation
      .findFirst as unknown as ReturnType<typeof vi.fn>;
    mockFind.mockResolvedValueOnce(null);

    const mockCreate = prismaMock.practiceInformation
      .create as unknown as ReturnType<typeof vi.fn>;
    const expectedNewRecord = {
      id: "new-id",
      clinician_id: mockClinicianId,
      practice_name: validUpdateData.practiceName,
      practice_email: validUpdateData.practiceEmail,
      time_zone: validUpdateData.timeZone,
      practice_logo: validUpdateData.practiceLogo,
      phone_numbers: JSON.stringify(validUpdateData.phoneNumbers),
      tele_health: true,
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
    const mockFind = prismaMock.practiceInformation
      .findFirst as unknown as ReturnType<typeof vi.fn>;
    mockFind.mockResolvedValueOnce({
      id: "existing-id",
      clinician_id: mockClinicianId,
    });

    const mockUpdate = prismaMock.practiceInformation
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
    const mockFind = prismaMock.practiceInformation
      .findFirst as unknown as ReturnType<typeof vi.fn>;
    mockFind.mockResolvedValueOnce(null);

    const mockCreate = prismaMock.practiceInformation
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
