import { vi } from "vitest";
import { describe, it, expect, beforeEach } from "vitest";
import prismaMock from "@mcw/database/mock";
import { GET } from "@/api/client/group/route";
import { createRequest } from "@mcw/utils";
// Mock modules before importing the module that depends on them
vi.mock("@mcw/database", () => ({
  prisma: prismaMock,
  getDbLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    error: vi.fn(),
  }),
}));

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

vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn().mockImplementation(() => prismaMock),
}));

// Import the module under test after all mocks are defined

describe("Client Group API Unit Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // Generate valid UUID for testing
  const generateUUID = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0,
          v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  };

  // Helper to create a mock client group
  const mockClientGroup = (overrides = {}) => ({
    id: generateUUID(),
    name: "Test Client Group",
    type: "FAMILY",
    clinician_id: null,
    ...overrides,
  });

  it("GET /api/client/group should return all client groups", async () => {
    // Arrange
    const group1 = mockClientGroup({
      id: generateUUID(),
      name: "Family Group",
      is_active: true,
      type: "FAMILY",
    });
    const group2 = mockClientGroup({
      id: generateUUID(),
      name: "Corporate Group",
      is_active: true,
      type: "ORGANIZATION",
      clinician_id: generateUUID(),
    });
    const clientGroups = [group1, group2];

    prismaMock.clientGroup.findMany.mockResolvedValueOnce(clientGroups);

    // Act
    const response = await GET(createRequest("/api/client/group"));

    // Assert
    expect(response.status).toBe(200);
    const json = await response.json();

    // Test individual properties instead of deep equality since dates are serialized
    expect(json).toHaveLength(clientGroups.length);

    // Check first group
    expect(json[0].id).toBe(clientGroups[0].id);
    expect(json[0].name).toBe(clientGroups[0].name);
    expect(json[0].type).toBe(clientGroups[0].type);

    // Check second group
    expect(json[1].id).toBe(clientGroups[1].id);
    expect(json[1].name).toBe(clientGroups[1].name);
    expect(json[1].type).toBe(clientGroups[1].type);

    expect(prismaMock.clientGroup.findMany).toHaveBeenCalled();
  });

  it("GET /api/client/group should handle empty results", async () => {
    // Arrange
    prismaMock.clientGroup.findMany.mockResolvedValueOnce([]);

    // Act
    const response = await GET(createRequest("/api/client/group"));

    // Assert
    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toEqual([]);
    expect(Array.isArray(json)).toBe(true);
  });

  it("GET /api/client/group should handle database errors", async () => {
    // Arrange
    const mockError = new Error("Database connection error");
    prismaMock.clientGroup.findMany.mockRejectedValueOnce(mockError);

    // Act
    const response = await GET(createRequest("/api/client/group"));

    // Assert
    expect(response.status).toBe(500);
    const json = await response.json();

    expect(json).toHaveProperty("error", "Failed to fetch client groups");
  });
});
