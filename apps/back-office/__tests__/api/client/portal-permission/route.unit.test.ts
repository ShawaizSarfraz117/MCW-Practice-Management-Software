import { beforeEach, describe, expect, it, vi, Mock } from "vitest";
import { NextRequest } from "next/server";

// Create a proper mock request type
interface MockRequest {
  json: () => Promise<Record<string, unknown>>;
  headers: {
    get: (name: string) => string | null;
  };
}

// Mock external dependencies
vi.mock("@mcw/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
  __esModule: true,
}));

vi.mock("@mcw/database", () => {
  const clientPortalPermissionUpdateMock = vi.fn();

  return {
    prisma: {
      clientPortalPermission: {
        update: clientPortalPermissionUpdateMock,
      },
    },
    __esModule: true,
  };
});

vi.mock("@/utils/helpers", () => ({
  getBackOfficeSession: vi.fn().mockResolvedValue({
    user: { id: "user-123" },
  }),
  __esModule: true,
}));

vi.mock("@mcw/utils", () => ({
  withErrorHandling: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
  __esModule: true,
}));

// Import after mocks are defined
import { PUT } from "@/api/client/portal-permission/route";
import { prisma } from "@mcw/database";
import { getBackOfficeSession } from "@/utils/helpers";

// Helper function to create mock request
function createMockRequest(body: Record<string, unknown>): NextRequest {
  const mockRequest: MockRequest = {
    json: vi.fn().mockResolvedValue(body),
    headers: {
      get: vi.fn().mockReturnValue(null),
    },
  };

  return mockRequest as NextRequest;
}

describe("Client Portal Permissions API", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Mock session to return valid user
    (getBackOfficeSession as Mock).mockResolvedValue({
      user: { id: "user-123" },
    });
  });

  describe("PUT /api/client/portal-permission", () => {
    it("should update all client portal permissions successfully", async () => {
      // Arrange
      const requestData = {
        client_id: "12345678-1234-1234-1234-123456789012",
        allow_appointment_requests: true,
        access_billing_documents: true,
        use_secure_messaging: true,
      };

      const mockPortalPermission = {
        id: "permission-123",
        client_id: "12345678-1234-1234-1234-123456789012",
        email: "john@example.com",
        allow_appointment_requests: true,
        access_billing_documents: true,
        use_secure_messaging: true,
        receive_announcements: true,
        is_active: true,
      };

      (prisma.clientPortalPermission.update as Mock).mockResolvedValue(
        mockPortalPermission,
      );

      // Mock the request
      const mockRequest = createMockRequest(requestData);

      // Act
      const response = await PUT(mockRequest);

      // Assert
      expect(response.status).toBe(200);
      const json = await response.json();

      expect(json).toEqual({ data: mockPortalPermission });
      expect(prisma.clientPortalPermission.update).toHaveBeenCalledWith({
        where: { client_id: requestData.client_id },
        data: {
          allow_appointment_requests: true,
          access_billing_documents: true,
          use_secure_messaging: true,
        },
      });
    });

    it("should update a subset of client portal permissions", async () => {
      // Arrange
      const requestData = {
        client_id: "12345678-1234-1234-1234-123456789012",
        allow_appointment_requests: true,
        // Only updating one field
      };

      const mockPortalPermission = {
        id: "permission-123",
        client_id: "12345678-1234-1234-1234-123456789012",
        email: "john@example.com",
        allow_appointment_requests: true,
        access_billing_documents: false,
        use_secure_messaging: false,
        receive_announcements: true,
        is_active: true,
      };

      (prisma.clientPortalPermission.update as Mock).mockResolvedValue(
        mockPortalPermission,
      );

      // Mock the request
      const mockRequest = createMockRequest(requestData);

      // Act
      const response = await PUT(mockRequest);

      // Assert
      expect(response.status).toBe(200);
      const json = await response.json();

      expect(json).toEqual({ data: mockPortalPermission });
      expect(prisma.clientPortalPermission.update).toHaveBeenCalledWith({
        where: { client_id: requestData.client_id },
        data: {
          allow_appointment_requests: true,
        },
      });
    });

    it("should return 400 when client_id is missing", async () => {
      // Arrange
      const requestData = {
        // Missing client_id
        allow_appointment_requests: true,
      };

      // Mock the request
      const mockRequest = createMockRequest(requestData);

      // Act
      const response = await PUT(mockRequest);

      // Assert
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty("error", "Client ID is required");
      expect(prisma.clientPortalPermission.update).not.toHaveBeenCalled();
    });

    it("should return 500 when database operation fails", async () => {
      // Arrange
      const requestData = {
        client_id: "12345678-1234-1234-1234-123456789012",
        allow_appointment_requests: true,
      };

      (prisma.clientPortalPermission.update as Mock).mockRejectedValue(
        new Error("Database error"),
      );

      // Mock the request
      const mockRequest = createMockRequest(requestData);

      // Act
      const response = await PUT(mockRequest);

      // Assert
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json).toHaveProperty(
        "error",
        "Failed to update client portal permission",
      );
      expect(prisma.clientPortalPermission.update).toHaveBeenCalled();
    });

    it("should return 401 when session is invalid", async () => {
      // Arrange
      const requestData = {
        client_id: "12345678-1234-1234-1234-123456789012",
        allow_appointment_requests: true,
      };

      // Mock invalid session
      (getBackOfficeSession as Mock).mockResolvedValue(null);

      // Mock the request
      const mockRequest = createMockRequest(requestData);

      // Act
      const response = await PUT(mockRequest);

      // Assert
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toHaveProperty("error", "Unauthorized");
      expect(prisma.clientPortalPermission.update).not.toHaveBeenCalled();
    });
  });
});
