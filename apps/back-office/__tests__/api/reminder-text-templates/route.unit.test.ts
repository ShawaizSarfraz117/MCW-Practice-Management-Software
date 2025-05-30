import { vi } from "vitest";
import { describe, it, expect, beforeEach } from "vitest";
import prismaMock from "@mcw/database/mock";
import { GET } from "@/api/reminder-text-templates/route";

// Mock the logger
vi.mock("@mcw/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
  getDbLogger: vi.fn(),
}));

describe("GET /api/reminder-text-templates Unit Tests", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.resetAllMocks();
  });

  it("should return all templates ordered by type", async () => {
    const mockTemplates = [
      {
        id: "1",
        type: "appointment",
        content:
          "Hi {{clientName}}, your appointment is on {{appointmentDate}} at {{appointmentTime}}.",
      },
      {
        id: "2",
        type: "telehealth",
        content:
          "Your telehealth session with {{clinicianName}} starts in 15 minutes.",
      },
    ];

    prismaMock.reminderTextTemplates.findMany.mockResolvedValueOnce(
      mockTemplates,
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockTemplates);
    expect(prismaMock.reminderTextTemplates.findMany).toHaveBeenCalledWith({
      orderBy: { type: "asc" },
    });
  });

  it("should return empty array when no templates exist", async () => {
    prismaMock.reminderTextTemplates.findMany.mockResolvedValueOnce([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
    expect(Array.isArray(data)).toBe(true);
  });

  it("should handle database errors and return 500", async () => {
    const dbError = new Error("Database connection failed");
    prismaMock.reminderTextTemplates.findMany.mockRejectedValueOnce(dbError);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toHaveProperty(
      "error",
      "Failed to fetch reminder text templates",
    );
  });

  it("should handle non-Error exceptions", async () => {
    prismaMock.reminderTextTemplates.findMany.mockRejectedValueOnce(
      "String error",
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toHaveProperty(
      "error",
      "Failed to fetch reminder text templates",
    );
  });
});
