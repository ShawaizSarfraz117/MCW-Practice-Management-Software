import { beforeEach, describe, expect, it, vi, Mock } from "vitest";

// Mock external dependencies
vi.mock("@mcw/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
  __esModule: true,
}));

vi.mock("@mcw/database", () => {
  const clientFindUniqueMock = vi.fn();
  const clientUpdateMock = vi.fn();

  return {
    prisma: {
      client: {
        findUnique: clientFindUniqueMock,
        update: clientUpdateMock,
      },
    },
    __esModule: true,
  };
});

// Import after mocks are defined
import { PUT } from "@/api/client/portal-permission/route";
import { createRequestWithBody } from "@mcw/utils";
import { prisma } from "@mcw/database";

describe("Client Portal Permissions API", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("PUT /api/client/portal-permission", () => {
    it("should update all client portal permissions successfully", async () => {
      // Arrange
      const requestData = {
        client_id: "12345678-1234-1234-1234-123456789012",
        allow_online_appointment: true,
        access_billing_documents: true,
        use_secure_messaging: true,
      };

      const mockClient = {
        id: "12345678-1234-1234-1234-123456789012",
        legal_first_name: "John",
        legal_last_name: "Doe",
        allow_online_appointment: true,
        access_billing_documents: true,
        use_secure_messaging: true,
      };

      (prisma.client.findUnique as Mock).mockResolvedValue({
        id: mockClient.id,
      });
      (prisma.client.update as Mock).mockResolvedValue(mockClient);

      // Act
      const req = createRequestWithBody(
        "/api/client/portal-permission",
        requestData,
      );
      const response = await PUT(req);

      // Assert
      expect(response.status).toBe(200);
      const json = await response.json();

      expect(json).toEqual(mockClient);
      expect(prisma.client.update).toHaveBeenCalledWith({
        where: { id: requestData.client_id },
        data: {
          allow_online_appointment: true,
          access_billing_documents: true,
          use_secure_messaging: true,
        },
        select: {
          id: true,
          legal_first_name: true,
          legal_last_name: true,
          allow_online_appointment: true,
          access_billing_documents: true,
          use_secure_messaging: true,
        },
      });
    });

    it("should update a subset of client portal permissions", async () => {
      // Arrange
      const requestData = {
        client_id: "12345678-1234-1234-1234-123456789012",
        allow_online_appointment: true,
        // Only updating one field
      };

      const mockClient = {
        id: "12345678-1234-1234-1234-123456789012",
        legal_first_name: "John",
        legal_last_name: "Doe",
        allow_online_appointment: true,
        access_billing_documents: false,
        use_secure_messaging: false,
      };

      (prisma.client.findUnique as Mock).mockResolvedValue({
        id: mockClient.id,
      });
      (prisma.client.update as Mock).mockResolvedValue(mockClient);

      // Act
      const req = createRequestWithBody(
        "/api/client/portal-permission",
        requestData,
      );
      const response = await PUT(req);

      // Assert
      expect(response.status).toBe(200);
      const json = await response.json();

      expect(json).toEqual(mockClient);
      expect(prisma.client.update).toHaveBeenCalledWith({
        where: { id: requestData.client_id },
        data: {
          allow_online_appointment: true,
        },
        select: {
          id: true,
          legal_first_name: true,
          legal_last_name: true,
          allow_online_appointment: true,
          access_billing_documents: true,
          use_secure_messaging: true,
        },
      });
    });

    it("should return 400 when client_id is invalid", async () => {
      // Arrange
      const requestData = {
        client_id: "invalid-uuid", // Invalid UUID format
        allow_online_appointment: true,
      };

      // Act
      const req = createRequestWithBody(
        "/api/client/portal-permission",
        requestData,
      );
      const response = await PUT(req);

      // Assert
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty("error", "Invalid request data");
      expect(json).toHaveProperty("details");
      expect(prisma.client.update).not.toHaveBeenCalled();
    });

    it("should return 400 when no permission fields are provided", async () => {
      // Arrange
      const requestData = {
        client_id: "12345678-1234-1234-1234-123456789012",
        // No permission fields provided
      };

      (prisma.client.findUnique as Mock).mockResolvedValue({
        id: requestData.client_id,
      });

      // Act
      const req = createRequestWithBody(
        "/api/client/portal-permission",
        requestData,
      );
      const response = await PUT(req);

      // Assert
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty(
        "error",
        "No portal permission fields provided to update",
      );
      expect(prisma.client.update).not.toHaveBeenCalled();
    });

    it("should return 404 when client is not found", async () => {
      // Arrange
      const requestData = {
        client_id: "12345678-1234-1234-1234-123456789012",
        allow_online_appointment: true,
      };

      (prisma.client.findUnique as Mock).mockResolvedValue(null);

      // Act
      const req = createRequestWithBody(
        "/api/client/portal-permission",
        requestData,
      );
      const response = await PUT(req);

      // Assert
      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json).toHaveProperty("error", "Client not found");
      expect(prisma.client.update).not.toHaveBeenCalled();
    });

    it("should handle database errors gracefully", async () => {
      // Arrange
      const requestData = {
        client_id: "12345678-1234-1234-1234-123456789012",
        allow_online_appointment: true,
      };

      (prisma.client.findUnique as Mock).mockResolvedValue({
        id: requestData.client_id,
      });
      (prisma.client.update as Mock).mockRejectedValue(
        new Error("Database error"),
      );

      // Act
      const req = createRequestWithBody(
        "/api/client/portal-permission",
        requestData,
      );
      const response = await PUT(req);

      // Assert
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json).toHaveProperty(
        "error",
        "Failed to update client portal permissions",
      );
      expect(json).toHaveProperty("message", "Database error");
    });
  });
});
