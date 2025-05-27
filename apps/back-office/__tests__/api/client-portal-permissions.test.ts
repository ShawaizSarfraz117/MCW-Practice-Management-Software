import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMocks } from "node-mocks-http";
import { GET, PUT } from "../../src/app/api/client-portal-permissions/route";
import { prisma } from "@mcw/database";
import { getServerSession } from "next-auth";
import type { PrismaClient } from "@prisma/client";

// Mock next-auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

// Mock prisma
vi.mock("@mcw/database", () => ({
  prisma: {
    clientPortalPermission: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  } as unknown as PrismaClient,
}));

describe("Client Portal Permissions API", () => {
  const mockAdminSession = {
    user: {
      role: "ADMIN",
    },
  };

  const mockNonAdminSession = {
    user: {
      role: "USER",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/client-portal-permissions", () => {
    it("should return 401 if user is not authenticated", async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);
      createMocks({ method: "GET" }); // Just to satisfy the test setup

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 401 if user is not an admin", async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockNonAdminSession);
      createMocks({ method: "GET" }); // Just to satisfy the test setup

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return existing permissions if found", async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockAdminSession);
      const mockPermissions = {
        id: "123",
        startTime: "09:00",
        endTime: "17:00",
        weeklyDisplay: "Show full week",
        cancellationHours: 24,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.clientPortalPermission.findFirst).mockResolvedValue(
        mockPermissions,
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockPermissions);
    });

    it("should create and return default permissions if none exist", async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockAdminSession);
      vi.mocked(prisma.clientPortalPermission.findFirst).mockResolvedValue(
        null,
      );

      const mockDefaultPermissions = {
        id: "123",
        startTime: "09:00",
        endTime: "17:00",
        weeklyDisplay: "Show full week",
        cancellationHours: 24,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.clientPortalPermission.create).mockResolvedValue(
        mockDefaultPermissions,
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockDefaultPermissions);
      expect(prisma.clientPortalPermission.create).toHaveBeenCalledWith({
        data: {
          startTime: "09:00",
          endTime: "17:00",
          weeklyDisplay: "Show full week",
          cancellationHours: 24,
        },
      });
    });
  });

  describe("PUT /api/client-portal-permissions", () => {
    it("should return 401 if user is not authenticated", async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);
      const { req } = createMocks({
        method: "PUT",
        body: {
          startTime: "09:00",
          endTime: "17:00",
          weeklyDisplay: "Show full week",
          cancellationHours: 24,
        },
      });

      const response = await PUT(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 401 if user is not an admin", async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockNonAdminSession);
      const { req } = createMocks({
        method: "PUT",
        body: {
          startTime: "09:00",
          endTime: "17:00",
          weeklyDisplay: "Show full week",
          cancellationHours: 24,
        },
      });

      const response = await PUT(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 400 if request body is invalid", async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockAdminSession);
      const { req } = createMocks({
        method: "PUT",
        body: {
          startTime: "invalid",
          endTime: "17:00",
          weeklyDisplay: "invalid",
          cancellationHours: "not a number",
        },
      });

      const response = await PUT(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid request data");
    });

    it("should return 400 if end time is before start time", async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockAdminSession);
      const { req } = createMocks({
        method: "PUT",
        body: {
          startTime: "17:00",
          endTime: "09:00",
          weeklyDisplay: "Show full week",
          cancellationHours: 24,
        },
      });

      const response = await PUT(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("End time must be after start time");
    });

    it("should create new permissions if none exist", async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockAdminSession);
      vi.mocked(prisma.clientPortalPermission.findFirst).mockResolvedValue(
        null,
      );

      const mockNewPermissions = {
        id: "123",
        startTime: "09:00",
        endTime: "17:00",
        weeklyDisplay: "Show full week",
        cancellationHours: 24,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.clientPortalPermission.create).mockResolvedValue(
        mockNewPermissions,
      );

      const { req } = createMocks({
        method: "PUT",
        body: {
          startTime: "09:00",
          endTime: "17:00",
          weeklyDisplay: "Show full week",
          cancellationHours: 24,
        },
      });

      const response = await PUT(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Settings created successfully");
      expect(data.data).toEqual(mockNewPermissions);
    });

    it("should update existing permissions", async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockAdminSession);
      const existingPermissions = {
        id: "123",
        startTime: "09:00",
        endTime: "17:00",
        weeklyDisplay: "Show full week",
        cancellationHours: 24,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.clientPortalPermission.findFirst).mockResolvedValue(
        existingPermissions,
      );

      const updatedPermissions = {
        ...existingPermissions,
        startTime: "10:00",
        endTime: "18:00",
        updatedAt: new Date(),
      };

      vi.mocked(prisma.clientPortalPermission.update).mockResolvedValue(
        updatedPermissions,
      );

      const { req } = createMocks({
        method: "PUT",
        body: {
          startTime: "10:00",
          endTime: "18:00",
          weeklyDisplay: "Show full week",
          cancellationHours: 24,
        },
      });

      const response = await PUT(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Settings updated successfully");
      expect(data.data).toEqual(updatedPermissions);
    });
  });
});
