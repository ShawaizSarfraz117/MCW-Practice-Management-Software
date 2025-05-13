import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "../../../src/app/api/permissions/route";
import { createRequest } from "@mcw/utils";

// Mock modules before imports that might use them
vi.mock("@/utils/helpers", () => ({
  getBackOfficeSession: vi.fn(),
}));

vi.mock("@mcw/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
  getDbLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

// We need to explicitly mock prisma's findMany to override the database/mock
vi.mock("@mcw/database", () => ({
  prisma: {
    permission: {
      findMany: vi.fn(),
    },
  },
}));

// Get references to the mocks
const { getBackOfficeSession } = await import("@/utils/helpers");
const { logger } = await import("@mcw/logger");
const { prisma } = await import("@mcw/database");

describe("Permissions API Unit Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Set default mock return value for authentication
    vi.mocked(getBackOfficeSession).mockResolvedValue({
      user: {
        id: "mock-user-id",
        email: "test@example.com",
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  });

  // Mock permission data
  const mockPermission = (overrides = {}) => ({
    id: "perm-id-1",
    name: "Create Client",
    slug: "create-client",
    RolePermission: [],
    ...overrides,
  });

  // Mock role data
  const mockRole = (overrides = {}) => ({
    id: "role-id-1",
    name: "Admin",
    description: "Administrator role",
    ...overrides,
  });

  // Mock role permission relation
  const mockRolePermission = (
    roleId = "role-id-1",
    permissionId = "perm-id-1",
  ) => ({
    role_id: roleId,
    permission_id: permissionId,
    Role: mockRole({ id: roleId }),
  });

  it("GET /api/permissions should return all permissions", async () => {
    // Mock permissions with role relations
    const mockPermissions = [
      mockPermission({
        id: "perm-id-1",
        name: "Create Client",
        slug: "create-client",
        RolePermission: [mockRolePermission("role-id-1", "perm-id-1")],
      }),
      mockPermission({
        id: "perm-id-2",
        name: "Edit Client",
        slug: "edit-client",
        RolePermission: [mockRolePermission("role-id-1", "perm-id-2")],
      }),
    ];

    // Mock the Prisma findMany method
    vi.mocked(prisma.permission.findMany).mockResolvedValueOnce(
      mockPermissions,
    );

    // Create a request with no query parameters
    const req = createRequest("/api/permissions");
    const response = await GET(req);

    // Verify response status and data
    expect(response.status).toBe(200);
    const responseData = await response.json();

    // Check returned data structure
    expect(responseData).toHaveLength(2);
    expect(responseData[0]).toHaveProperty("id", "perm-id-1");
    expect(responseData[0]).toHaveProperty("name", "Create Client");
    expect(responseData[0].RolePermission).toHaveLength(1);
    expect(responseData[0].RolePermission[0].Role).toHaveProperty(
      "name",
      "Admin",
    );

    // Verify Prisma was called with the correct parameters
    expect(prisma.permission.findMany).toHaveBeenCalledWith({
      where: {},
      include: {
        RolePermission: {
          include: {
            Role: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  });

  it("GET /api/permissions?roleId=xxx should filter permissions by role", async () => {
    // Mock filtered permissions
    const mockFilteredPermissions = [
      mockPermission({
        id: "perm-id-1",
        name: "Create Client",
        slug: "create-client",
        RolePermission: [mockRolePermission("role-id-2", "perm-id-1")],
      }),
    ];

    // Mock the Prisma findMany method
    vi.mocked(prisma.permission.findMany).mockResolvedValueOnce(
      mockFilteredPermissions,
    );

    // Create a request with roleId filter
    const req = createRequest("/api/permissions?roleId=role-id-2");
    const response = await GET(req);

    // Verify response status and data
    expect(response.status).toBe(200);
    const responseData = await response.json();

    // Check returned data
    expect(responseData).toHaveLength(1);
    expect(responseData[0]).toHaveProperty("id", "perm-id-1");
    expect(responseData[0].RolePermission[0].Role).toHaveProperty(
      "id",
      "role-id-2",
    );

    // Verify Prisma was called with the role filter
    expect(prisma.permission.findMany).toHaveBeenCalledWith({
      where: {
        RolePermission: {
          some: {
            role_id: "role-id-2",
          },
        },
      },
      include: {
        RolePermission: {
          include: {
            Role: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  });

  it("GET /api/permissions?name=xxx should filter permissions by name", async () => {
    // Mock filtered permissions by name
    const mockFilteredPermissions = [
      mockPermission({
        id: "perm-id-2",
        name: "Edit Client",
        slug: "edit-client",
        RolePermission: [mockRolePermission("role-id-1", "perm-id-2")],
      }),
    ];

    // Mock the Prisma findMany method
    vi.mocked(prisma.permission.findMany).mockResolvedValueOnce(
      mockFilteredPermissions,
    );

    // Create a request with name filter
    const req = createRequest("/api/permissions?name=Edit");
    const response = await GET(req);

    // Verify response status and data
    expect(response.status).toBe(200);
    const responseData = await response.json();

    // Check returned data
    expect(responseData).toHaveLength(1);
    expect(responseData[0]).toHaveProperty("name", "Edit Client");

    // Verify Prisma was called with the name filter
    expect(prisma.permission.findMany).toHaveBeenCalledWith({
      where: {
        name: {
          contains: "Edit",
        },
      },
      include: {
        RolePermission: {
          include: {
            Role: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  });

  it("GET /api/permissions should return 401 if not authenticated", async () => {
    // Override the mock to return null for unauthenticated request
    vi.mocked(getBackOfficeSession).mockResolvedValueOnce(null);

    // Create a request
    const req = createRequest("/api/permissions");
    const response = await GET(req);

    // Verify response is unauthorized
    expect(response.status).toBe(401);
    const responseData = await response.json();
    expect(responseData).toHaveProperty("error", "Unauthorized");

    // Verify Prisma was not called
    expect(prisma.permission.findMany).not.toHaveBeenCalled();
  });

  it("GET /api/permissions should handle database errors", async () => {
    // Mock Prisma to throw an error
    vi.mocked(prisma.permission.findMany).mockRejectedValueOnce(
      new Error("Database error"),
    );

    // Create a request
    const req = createRequest("/api/permissions");
    const response = await GET(req);

    // Verify response is error
    expect(response.status).toBe(500);
    const responseData = await response.json();
    expect(responseData).toHaveProperty("error", "Failed to fetch permissions");

    // Verify logger.error was called
    expect(logger.error).toHaveBeenCalled();
  });
});
