import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { GET } from "@/api/permissions/route";
import { createRequest } from "@mcw/utils";
import { prisma } from "@mcw/database";
import { Permission, RolePermission } from "@prisma/client";

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

// Get references to the mocks
const { getBackOfficeSession } = await import("@/utils/helpers");
// We import the logger but don't use it directly in the integration tests
await import("@mcw/logger");

// Define the shape of permission with role relationships
interface PermissionWithRoles extends Permission {
  RolePermission: Array<
    RolePermission & {
      Role: {
        id: string;
        name: string;
        description?: string;
      };
    }
  >;
}

describe("Permissions API Integration Tests", () => {
  // Track created entities for cleanup
  const createdPermissionIds: string[] = [];
  const createdRoleIds: string[] = [];

  // Set up default authentication for tests
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();

    // Set default authentication
    vi.mocked(getBackOfficeSession).mockResolvedValue({
      user: {
        id: "mock-user-id",
        email: "test@example.com",
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  });

  // Clean up after tests
  afterEach(async () => {
    // Clean up RolePermission relations (no need to track IDs, they're composite)
    if (createdPermissionIds.length > 0) {
      await prisma.rolePermission.deleteMany({
        where: {
          permission_id: { in: createdPermissionIds },
        },
      });
    }

    // Clean up permissions
    if (createdPermissionIds.length > 0) {
      await prisma.permission.deleteMany({
        where: { id: { in: createdPermissionIds } },
      });
      createdPermissionIds.length = 0;
    }

    // Clean up roles
    if (createdRoleIds.length > 0) {
      await prisma.role.deleteMany({
        where: { id: { in: createdRoleIds } },
      });
      createdRoleIds.length = 0;
    }
  });

  // Helper function to create a test permission
  const createTestPermission = async (name: string, slug: string) => {
    const permission = await prisma.permission.create({
      data: {
        name,
        slug,
      },
    });
    createdPermissionIds.push(permission.id);
    return permission;
  };

  // Helper function to create a test role
  const createTestRole = async (
    name: string,
    description: string = "Test role",
  ) => {
    // Add a random suffix to avoid unique constraint violations
    const uniqueName = `${name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const role = await prisma.role.create({
      data: {
        name: uniqueName,
        description,
      },
    });
    createdRoleIds.push(role.id);
    return role;
  };

  // Helper function to assign permission to role
  const assignPermissionToRole = async (
    roleId: string,
    permissionId: string,
  ) => {
    return await prisma.rolePermission.create({
      data: {
        role_id: roleId,
        permission_id: permissionId,
      },
    });
  };

  it("GET /api/permissions should return all permissions", async () => {
    // Create test permissions
    const permission1 = await createTestPermission(
      "Create Client",
      "create-client",
    );
    const permission2 = await createTestPermission(
      "Edit Client",
      "edit-client",
    );

    // Create a test role
    const role = await createTestRole("Admin");

    // Assign permissions to role
    await assignPermissionToRole(role.id, permission1.id);
    await assignPermissionToRole(role.id, permission2.id);

    // Create a request with no query parameters
    const req = createRequest("/api/permissions");
    const response = await GET(req);

    // Verify response status and data
    expect(response.status).toBe(200);
    const responseData = (await response.json()) as PermissionWithRoles[];

    // Check returned data structure - should include our test permissions
    expect(responseData.length).toBeGreaterThanOrEqual(2);

    // Find our created test permissions in the response
    const foundPermission1 = responseData.find((p) => p.id === permission1.id);
    const foundPermission2 = responseData.find((p) => p.id === permission2.id);

    // Verify permissions are returned with correct data
    expect(foundPermission1).toBeDefined();
    expect(foundPermission1).toHaveProperty("name", "Create Client");
    expect(foundPermission1).toHaveProperty("slug", "create-client");
    expect(foundPermission1?.RolePermission).toBeDefined();
    expect(foundPermission1?.RolePermission.length).toBeGreaterThanOrEqual(1);

    // Find the role permission relation for our test role
    const foundRolePermission = foundPermission1?.RolePermission.find(
      (rp) => rp.role_id === role.id,
    );
    expect(foundRolePermission).toBeDefined();
    expect(foundRolePermission?.Role).toHaveProperty("name");
    expect(foundRolePermission?.Role.name).toContain("Admin");

    // Check second permission
    expect(foundPermission2).toBeDefined();
    expect(foundPermission2).toHaveProperty("name", "Edit Client");
  });

  it("GET /api/permissions?roleId=xxx should filter permissions by role", async () => {
    // Create test permissions
    const permission1 = await createTestPermission(
      "View Reports",
      "view-reports",
    );
    const permission2 = await createTestPermission(
      "Delete Reports",
      "delete-reports",
    );

    // Create test roles
    const role1 = await createTestRole("Viewer");
    const role2 = await createTestRole("Manager");

    // Assign permissions to roles (permission1 to role1, both permissions to role2)
    await assignPermissionToRole(role1.id, permission1.id);
    await assignPermissionToRole(role2.id, permission1.id);
    await assignPermissionToRole(role2.id, permission2.id);

    // Create a request with roleId filter for role1
    const req = createRequest(`/api/permissions?roleId=${role1.id}`);
    const response = await GET(req);

    // Verify response status and data
    expect(response.status).toBe(200);
    const responseData = (await response.json()) as PermissionWithRoles[];

    // Should only return permission1 because it's assigned to role1
    const permissionIds = responseData.map((p) => p.id);
    expect(permissionIds).toContain(permission1.id);
    expect(permissionIds).not.toContain(permission2.id);

    // Check that the permission has the correct role relationship
    const foundPermission = responseData.find((p) => p.id === permission1.id);
    expect(foundPermission).toBeDefined();

    // There should be at least one RolePermission with role_id matching role1.id
    const hasRole1 = foundPermission?.RolePermission.some(
      (rp) => rp.role_id === role1.id,
    );
    expect(hasRole1).toBe(true);
  });

  it("GET /api/permissions?name=xxx should filter permissions by name", async () => {
    // Create test permissions with different names
    const permission1 = await createTestPermission(
      "Create Invoice",
      "create-invoice",
    );
    const permission2 = await createTestPermission(
      "View Invoice",
      "view-invoice",
    );
    const permission3 = await createTestPermission(
      "Delete Client",
      "delete-client",
    );

    // Create a request with name filter for "Invoice"
    const req = createRequest("/api/permissions?name=Invoice");
    const response = await GET(req);

    // Verify response status and data
    expect(response.status).toBe(200);
    const responseData = (await response.json()) as PermissionWithRoles[];

    // Should only return permissions with "Invoice" in the name
    const permissionIds = responseData.map((p) => p.id);
    expect(permissionIds).toContain(permission1.id);
    expect(permissionIds).toContain(permission2.id);
    expect(permissionIds).not.toContain(permission3.id);

    // Verify returned permissions have correct names
    const names = responseData.map((p) => p.name);
    expect(names).toContain("Create Invoice");
    expect(names).toContain("View Invoice");
    expect(names).not.toContain("Delete Client");
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
  });
});
