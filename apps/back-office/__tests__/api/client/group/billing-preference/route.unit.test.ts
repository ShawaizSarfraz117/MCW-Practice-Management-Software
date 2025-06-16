import { beforeEach, describe, expect, it, vi, Mock } from "vitest";

// Mock external dependencies
vi.mock("@mcw/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
  __esModule: true,
}));

// Mock crypto module - importing first, then mocking
import * as crypto from "crypto";
vi.mock("crypto", () => ({
  randomUUID: vi.fn(() => "mocked-uuid-value"),
  __esModule: true,
}));

vi.mock("@mcw/database", () => {
  const clientGroupFindUniqueMock = vi.fn();
  const clientGroupUpdateMock = vi.fn();
  const clientBillingPreferencesFindFirstMock = vi.fn();
  const clientBillingPreferencesUpdateMock = vi.fn();
  const clientBillingPreferencesCreateMock = vi.fn();
  const clientGroupServicesDeleteManyMock = vi.fn();
  const clientGroupServicesCreateManyMock = vi.fn();

  const prismaMock = {
    clientGroup: {
      findUnique: clientGroupFindUniqueMock,
      update: clientGroupUpdateMock,
    },
    clientBillingPreferences: {
      findFirst: clientBillingPreferencesFindFirstMock,
      update: clientBillingPreferencesUpdateMock,
      create: clientBillingPreferencesCreateMock,
    },
    clientGroupServices: {
      deleteMany: clientGroupServicesDeleteManyMock,
      createMany: clientGroupServicesCreateManyMock,
    },
    $transaction: vi.fn().mockImplementation(async (callback) => {
      // Execute the callback with the mocked prisma instance
      return callback(prismaMock);
    }),
  };

  return {
    prisma: prismaMock,
    __esModule: true,
  };
});

// Import after mocks are defined
import { POST } from "@/api/client/group/billing-preference/route";
import { createRequestWithBody } from "@mcw/utils";
import { prisma } from "@mcw/database";

describe("Client Billing Preferences API", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Reset the mock implementation with a valid UUID format
    vi.mocked(crypto.randomUUID).mockReturnValue(
      "12345678-1234-1234-1234-123456789012",
    );
  });

  describe("POST /api/client/group/billing-preference", () => {
    const validClientGroupId = "12345678-1234-1234-1234-123456789012";

    it("should create new billing preferences when none exist", async () => {
      // Arrange
      const requestData = {
        client_group_id: validClientGroupId,
        email_generated_invoices: true,
        notify_new_statements: true,
      };

      const mockCreatedPreferences = {
        id: "12345678-1234-1234-1234-123456789012",
        client_group_id: validClientGroupId,
        email_generated_invoices: true,
        email_generated_statements: false,
        email_generated_superbills: false,
        notify_new_invoices: false,
        notify_new_statements: true,
        notify_new_superbills: false,
      };

      (prisma.clientGroup.findUnique as Mock).mockResolvedValue({
        id: validClientGroupId,
      });
      (prisma.clientBillingPreferences.findFirst as Mock).mockResolvedValue(
        null,
      );
      (prisma.clientBillingPreferences.create as Mock).mockResolvedValue(
        mockCreatedPreferences,
      );
      // Mock clientGroup.update
      (prisma.clientGroup.update as Mock).mockResolvedValue({
        id: validClientGroupId,
        auto_monthly_statement_enabled: false,
        auto_monthly_superbill_enabled: false,
      });

      // Mock transaction to return the expected result
      (prisma.$transaction as Mock).mockResolvedValue({
        billingPreferences: mockCreatedPreferences,
        isUpdate: false,
      });

      // Act
      const req = createRequestWithBody(
        "/api/client/group/billing-preference",
        requestData,
      );
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(201);
      const json = await response.json();

      expect(json).toEqual(mockCreatedPreferences);
      expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function));
    });

    it("should update existing billing preferences", async () => {
      // Arrange
      const requestData = {
        client_group_id: validClientGroupId,
        email_generated_statements: true,
        notify_new_invoices: true,
      };

      const existingPreferences = {
        id: "existing-pref-id",
        client_group_id: validClientGroupId,
        email_generated_invoices: true,
        email_generated_statements: false,
        email_generated_superbills: false,
        notify_new_invoices: false,
        notify_new_statements: false,
        notify_new_superbills: false,
      };

      const mockUpdatedPreferences = {
        ...existingPreferences,
        email_generated_statements: true,
        notify_new_invoices: true,
      };

      (prisma.clientGroup.findUnique as Mock).mockResolvedValue({
        id: validClientGroupId,
      });
      (prisma.clientBillingPreferences.findFirst as Mock).mockResolvedValue(
        existingPreferences,
      );
      (prisma.clientBillingPreferences.update as Mock).mockResolvedValue(
        mockUpdatedPreferences,
      );
      // Mock clientGroup.update
      (prisma.clientGroup.update as Mock).mockResolvedValue({
        id: validClientGroupId,
        auto_monthly_statement_enabled: true,
        auto_monthly_superbill_enabled: false,
      });

      // Mock transaction to return the expected result
      (prisma.$transaction as Mock).mockResolvedValue({
        billingPreferences: mockUpdatedPreferences,
        isUpdate: true,
      });

      // Act
      const req = createRequestWithBody(
        "/api/client/group/billing-preference",
        requestData,
      );
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(200);
      const json = await response.json();

      expect(json).toEqual(mockUpdatedPreferences);
      expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function));
    });

    it("should return 400 when client_group_id is invalid", async () => {
      // Arrange
      const requestData = {
        client_group_id: "invalid-uuid",
        email_generated_invoices: true,
      };

      // Act
      const req = createRequestWithBody(
        "/api/client/group/billing-preference",
        requestData,
      );
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty("error", "Invalid request data");
      expect(json).toHaveProperty("details");
      expect(prisma.clientBillingPreferences.create).not.toHaveBeenCalled();
      expect(prisma.clientBillingPreferences.update).not.toHaveBeenCalled();
    });

    it("should return 404 when client group is not found", async () => {
      // Arrange
      const requestData = {
        client_group_id: validClientGroupId,
        email_generated_invoices: true,
      };

      // Update the transaction mock to throw the error
      (prisma.$transaction as Mock).mockRejectedValue(
        new Error("Client group not found"),
      );
      (prisma.clientGroup.findUnique as Mock).mockResolvedValue(null);

      // Act
      const req = createRequestWithBody(
        "/api/client/group/billing-preference",
        requestData,
      );
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json).toHaveProperty("error", "Client group not found");
    });

    it("should handle database errors during create operation", async () => {
      // Arrange
      const requestData = {
        client_group_id: validClientGroupId,
        email_generated_invoices: true,
      };

      // Update the transaction mock to throw the error
      (prisma.$transaction as Mock).mockRejectedValue(
        new Error("Database error during create"),
      );
      (prisma.clientGroup.findUnique as Mock).mockResolvedValue({
        id: validClientGroupId,
      });
      (prisma.clientBillingPreferences.findFirst as Mock).mockResolvedValue(
        null,
      );
      (prisma.clientBillingPreferences.create as Mock).mockRejectedValue(
        new Error("Database error during create"),
      );

      // Act
      const req = createRequestWithBody(
        "/api/client/group/billing-preference",
        requestData,
      );
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json).toHaveProperty(
        "error",
        "Failed to process client billing preferences",
      );
      expect(json).toHaveProperty("message", "Database error during create");
    });

    it("should handle database errors during update operation", async () => {
      // Arrange
      const requestData = {
        client_group_id: validClientGroupId,
        email_generated_invoices: true,
      };

      const existingPreferences = {
        id: "existing-pref-id",
        client_group_id: validClientGroupId,
        email_generated_invoices: false,
      };

      // Update the transaction mock to throw the error
      (prisma.$transaction as Mock).mockRejectedValue(
        new Error("Database error during update"),
      );
      (prisma.clientGroup.findUnique as Mock).mockResolvedValue({
        id: validClientGroupId,
      });
      (prisma.clientBillingPreferences.findFirst as Mock).mockResolvedValue(
        existingPreferences,
      );
      (prisma.clientBillingPreferences.update as Mock).mockRejectedValue(
        new Error("Database error during update"),
      );

      // Act
      const req = createRequestWithBody(
        "/api/client/group/billing-preference",
        requestData,
      );
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json).toHaveProperty(
        "error",
        "Failed to process client billing preferences",
      );
      expect(json).toHaveProperty("message", "Database error during update");
    });
  });
});
