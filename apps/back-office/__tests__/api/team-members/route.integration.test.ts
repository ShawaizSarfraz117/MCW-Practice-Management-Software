/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
import { vi, describe, it, expect, beforeEach, afterEach, Mock } from "vitest";
import { GET, POST, PUT, DELETE } from "@/api/team-members/route";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { prisma } from "@mcw/database";
import { getBackOfficeSession } from "@/utils/helpers";
import { hash } from "bcryptjs";
import type { SafeUserWithRelations } from "@mcw/types";
import type { Session } from "next-auth";

// Mock Next.js auth helper
vi.mock("@/utils/helpers", () => ({
  getBackOfficeSession: vi.fn(),
}));

// Mock withErrorHandling to return unwrapped handlers for testing
vi.mock("@mcw/utils", async () => {
  const actual = await vi.importActual("@mcw/utils");
  return {
    ...(actual as Record<string, unknown>),
    withErrorHandling: <T extends (...args: unknown[]) => unknown>(fn: T) => fn, // Return the handler unwrapped
  };
});

// Test data factories
const createTestUser = async (overrides = {}) => {
  const defaultData = {
    email: `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
    password_hash: await hash("password123", 10),
    ...overrides,
  };
  return prisma.user.create({ data: defaultData });
};

const createTestRole = async (name: string) => {
  const existingRole = await prisma.role.findUnique({ where: { name } });
  if (existingRole) return existingRole;

  return prisma.role.create({
    data: {
      name,
      description: `${name} role`,
    },
  });
};

const createTestClinician = async (userId: string, overrides = {}) => {
  const defaultData = {
    user_id: userId,
    first_name: "Test",
    last_name: "Clinician",
    address: "123 Test St",
    percentage_split: 100,
    ...overrides,
  };
  return prisma.clinician.create({ data: defaultData });
};

const createTestService = async (type: string) => {
  const existingService = await prisma.practiceService.findFirst({
    where: { type },
  });
  if (existingService) return existingService;

  return prisma.practiceService.create({
    data: {
      type,
      rate: 150.0,
      code: `SVC-${type.substring(0, 3).toUpperCase()}`,
      description: `${type} service`,
      duration: 60,
      allow_new_clients: true,
      available_online: true,
      bill_in_units: false,
    },
  });
};

describe("Team Members API Integration Tests", () => {
  // Track created test data for cleanup
  let createdUserIds: string[] = [];
  let createdServiceIds: string[] = [];

  beforeEach(() => {
    vi.resetAllMocks();
    createdUserIds = [];
    createdServiceIds = [];

    // Mock authenticated session for all tests
    (
      getBackOfficeSession as Mock<typeof getBackOfficeSession>
    ).mockResolvedValue({
      user: {
        id: "test-user-id",
        email: "test@example.com",
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    } as Session);
  });

  afterEach(async () => {
    // Clean up test data in reverse order of dependencies
    if (createdUserIds.length > 0) {
      // Delete clinician services
      await prisma.clinicianServices.deleteMany({
        where: {
          Clinician: {
            user_id: { in: createdUserIds },
          },
        },
      });

      // Delete licenses
      await prisma.license.deleteMany({
        where: {
          Clinician: {
            user_id: { in: createdUserIds },
          },
        },
      });

      // Delete clinical infos
      await prisma.clinicalInfo.deleteMany({
        where: { user_id: { in: createdUserIds } },
      });

      // Delete clinicians
      await prisma.clinician.deleteMany({
        where: { user_id: { in: createdUserIds } },
      });

      // Delete user roles
      await prisma.userRole.deleteMany({
        where: { user_id: { in: createdUserIds } },
      });

      // Delete users
      await prisma.user.deleteMany({
        where: { id: { in: createdUserIds } },
      });
    }

    // Clean up created services if any
    if (createdServiceIds.length > 0) {
      await prisma.practiceService.deleteMany({
        where: {
          id: { in: createdServiceIds },
        },
      });
    }
  });

  describe("GET /api/team-members", () => {
    it("should return a list of team members with all related data", async () => {
      // Create test roles
      const adminRole = await createTestRole("ADMIN");
      const clinicianRole = await createTestRole("CLINICIAN.BASIC");

      // Create test users
      const adminUser = await createTestUser({
        email: `admin-test-${Date.now()}@example.com`,
      });
      createdUserIds.push(adminUser.id);

      const clinicianUser = await createTestUser({
        email: `clinician-test-${Date.now()}@example.com`,
      });
      createdUserIds.push(clinicianUser.id);

      // Assign roles
      await prisma.userRole.create({
        data: {
          user_id: adminUser.id,
          role_id: adminRole.id,
        },
      });

      await prisma.userRole.create({
        data: {
          user_id: clinicianUser.id,
          role_id: clinicianRole.id,
        },
      });

      // Create clinician data
      const clinician = await createTestClinician(clinicianUser.id, {
        first_name: "Dr",
        last_name: "Test",
      });

      // Create clinical info
      await prisma.clinicalInfo.create({
        data: {
          user_id: clinicianUser.id,
          speciality: "Psychiatry",
          taxonomy_code: "2084P0800X",
          NPI_number: 1234567890,
        },
      });

      // Create license
      await prisma.license.create({
        data: {
          clinician_id: clinician.id,
          license_type: "Medical",
          license_number: "MD12345",
          expiration_date: new Date("2025-12-31"),
          state: "CA",
        },
      });

      // Create and assign services
      const service1 = await createTestService("Individual Therapy");
      const service2 = await createTestService("Group Therapy");

      await prisma.clinicianServices.createMany({
        data: [
          {
            clinician_id: clinician.id,
            service_id: service1.id,
            is_active: true,
          },
          {
            clinician_id: clinician.id,
            service_id: service2.id,
            is_active: true,
          },
        ],
      });

      // Make request
      const request = createRequest("/api/team-members");
      const response = await GET(request);
      const data = await response.json();

      // Assert response
      expect(response.status).toBe(200);
      expect(data).toHaveProperty("data");
      expect(data).toHaveProperty("pagination");
      expect(data.data.length).toBeGreaterThanOrEqual(2);

      // Find our test users in the response
      const adminResult = data.data.find(
        (u: SafeUserWithRelations) => u.email === adminUser.email,
      );
      const clinicianResult = data.data.find(
        (u: SafeUserWithRelations) => u.email === clinicianUser.email,
      );

      // Verify admin user
      expect(adminResult).toBeDefined();
      expect(adminResult.UserRole).toHaveLength(1);
      expect(adminResult.UserRole[0].Role.name).toBe("ADMIN");
      expect(adminResult.Clinician).toBeNull();

      // Verify clinician user with all related data
      expect(clinicianResult).toBeDefined();
      expect(clinicianResult.UserRole).toHaveLength(1);
      expect(clinicianResult.UserRole[0].Role.name).toBe("CLINICIAN.BASIC");
      expect(clinicianResult.Clinician).toBeDefined();
      expect(clinicianResult.Clinician.first_name).toBe("Dr");
      expect(clinicianResult.Clinician.last_name).toBe("Test");
      expect(clinicianResult.Clinician.License).toHaveLength(1);
      expect(clinicianResult.Clinician.License[0].license_number).toBe(
        "MD12345",
      );
      expect(clinicianResult.Clinician.ClinicianServices).toHaveLength(2);
      expect(clinicianResult.clinicalInfos).toHaveLength(1);
      expect(clinicianResult.clinicalInfos[0].speciality).toBe("Psychiatry");
    });

    it("should filter by search term", async () => {
      // Create test user with specific name
      const user = await createTestUser({
        email: `searchable-user-${Date.now()}@example.com`,
      });
      createdUserIds.push(user.id);

      const role = await createTestRole("CLINICIAN.BASIC");
      await prisma.userRole.create({
        data: {
          user_id: user.id,
          role_id: role.id,
        },
      });

      await createTestClinician(user.id, {
        first_name: "Searchable",
        last_name: "Doctor",
      });

      // Search by email
      const emailRequest = createRequest("/api/team-members?search=searchable");
      const emailResponse = await GET(emailRequest);
      const emailData = await emailResponse.json();

      expect(emailResponse.status).toBe(200);
      const foundByEmail = emailData.data.find(
        (u: SafeUserWithRelations) => u.email === user.email,
      );
      expect(foundByEmail).toBeDefined();

      // Search by first name
      const nameRequest = createRequest("/api/team-members?search=Searchable");
      const nameResponse = await GET(nameRequest);
      const nameData = await nameResponse.json();

      const foundByName = nameData.data.find(
        (u: SafeUserWithRelations) => u.email === user.email,
      );
      expect(foundByName).toBeDefined();
    });

    it("should filter by role", async () => {
      // Create users with different roles
      const adminRole = await createTestRole("ADMIN");
      const clinicianRole = await createTestRole("CLINICIAN.FULL");

      const adminUser = await createTestUser({
        email: `role-admin-${Date.now()}@example.com`,
      });
      createdUserIds.push(adminUser.id);

      const clinicianUser = await createTestUser({
        email: `role-clinician-${Date.now()}@example.com`,
      });
      createdUserIds.push(clinicianUser.id);

      await prisma.userRole.create({
        data: {
          user_id: adminUser.id,
          role_id: adminRole.id,
        },
      });

      await prisma.userRole.create({
        data: {
          user_id: clinicianUser.id,
          role_id: clinicianRole.id,
        },
      });

      // Filter by CLINICIAN.FULL role
      const request = createRequest("/api/team-members?role=CLINICIAN.FULL");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      const clinicians = data.data.filter((u: SafeUserWithRelations) =>
        u.UserRole.some((ur) => ur.Role.name === "CLINICIAN.FULL"),
      );
      expect(clinicians.length).toBeGreaterThanOrEqual(1);
      expect(
        clinicians.some(
          (u: SafeUserWithRelations) => u.email === clinicianUser.email,
        ),
      ).toBe(true);
      expect(
        clinicians.some(
          (u: SafeUserWithRelations) => u.email === adminUser.email,
        ),
      ).toBe(false);
    });

    it("should handle pagination", async () => {
      // Create multiple test users
      const role = await createTestRole("ADMIN");
      for (let i = 0; i < 5; i++) {
        const user = await createTestUser({
          email: `pagination-test-${i}-${Date.now()}@example.com`,
        });
        createdUserIds.push(user.id);
        await prisma.userRole.create({
          data: {
            user_id: user.id,
            role_id: role.id,
          },
        });
      }

      // Request with small page size
      const request = createRequest("/api/team-members?page=1&pageSize=2");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(2);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.pageSize).toBe(2);
      expect(data.pagination.total).toBeGreaterThanOrEqual(5);
    });

    it("should return 401 if user is not authenticated", async () => {
      (
        getBackOfficeSession as Mock<typeof getBackOfficeSession>
      ).mockResolvedValueOnce(null);

      const request = createRequest("/api/team-members");
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty("error", "Unauthorized");
    });
  });

  describe("POST /api/team-members", () => {
    it("should create a new team member with full clinician data", async () => {
      // Ensure roles exist
      await createTestRole("CLINICIAN.FULL");

      // Create services
      const service1 = await createTestService("Test Service 1");
      const service2 = await createTestService("Test Service 2");
      createdServiceIds.push(service1.id, service2.id);

      const newUser = {
        email: `new-clinician-${Date.now()}@example.com`,
        firstName: "New",
        lastName: "Clinician",
        password: "SecurePass123!",
        roles: ["CLINICIAN.FULL"],
        specialty: "Psychiatry",
        npiNumber: "9876543210",
        license: {
          type: "Medical",
          number: "NEW123",
          expirationDate: "2026-12-31",
          state: "NY",
        },
        services: [service1.id, service2.id],
      };

      const request = createRequestWithBody("/api/team-members", newUser);
      const response = await POST(request);
      const data = await response.json();

      // Track for cleanup
      if (data.id) createdUserIds.push(data.id);

      // Assert response
      expect(response.status).toBe(201);
      expect(data).toHaveProperty("id");
      expect(data.email).toBe(newUser.email);
      expect(data.UserRole).toHaveLength(1);
      expect(data.UserRole[0].Role.name).toBe("CLINICIAN.FULL");
      expect(data.Clinician).toBeDefined();
      expect(data.Clinician.first_name).toBe("New");
      expect(data.Clinician.last_name).toBe("Clinician");
      expect(data.Clinician.License).toHaveLength(1);
      expect(data.Clinician.License[0].license_number).toBe("NEW123");
      expect(data.Clinician.ClinicianServices).toHaveLength(2);
      expect(data.clinicalInfos).toHaveLength(1);
      expect(data.clinicalInfos[0].speciality).toBe("Psychiatry");
      expect(data.clinicalInfos[0].NPI_number).toBe(9876543210);

      // Verify password was hashed
      const createdUser = await prisma.user.findUnique({
        where: { id: data.id },
      });
      expect(createdUser?.password_hash).not.toBe(newUser.password);
    });

    it("should create a non-clinician team member", async () => {
      await createTestRole("ADMIN");

      const newUser = {
        email: `new-admin-${Date.now()}@example.com`,
        firstName: "New",
        lastName: "Admin",
        password: "SecurePass123!",
        roles: ["ADMIN"],
      };

      const request = createRequestWithBody("/api/team-members", newUser);
      const response = await POST(request);
      const data = await response.json();

      if (data.id) createdUserIds.push(data.id);

      expect(response.status).toBe(201);
      expect(data.email).toBe(newUser.email);
      expect(data.UserRole[0].Role.name).toBe("ADMIN");
      expect(data.Clinician).toBeNull();
      expect(data.clinicalInfos).toHaveLength(0);
    });

    it("should return 409 if user already exists", async () => {
      const existingUser = await createTestUser({
        email: `existing-${Date.now()}@example.com`,
      });
      createdUserIds.push(existingUser.id);

      const newUser = {
        email: existingUser.email,
        firstName: "Test",
        lastName: "User",
        roles: ["ADMIN"],
      };

      const request = createRequestWithBody("/api/team-members", newUser);
      const response = await POST(request);

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data).toHaveProperty(
        "error",
        "User with this email already exists",
      );
    });

    it("should return 404 if role doesn't exist", async () => {
      const newUser = {
        email: `test-${Date.now()}@example.com`,
        firstName: "Test",
        lastName: "User",
        roles: ["NON_EXISTENT_ROLE"],
      };

      const request = createRequestWithBody("/api/team-members", newUser);
      const response = await POST(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toHaveProperty("error", "One or more roles not found");
      expect(data.missingRoles).toContain("NON_EXISTENT_ROLE");
    });

    it("should return 422 for invalid input", async () => {
      const invalidUser = {
        email: "invalid-email",
        firstName: "",
        lastName: "User",
        roles: [],
      };

      const request = createRequestWithBody("/api/team-members", invalidUser);
      const response = await POST(request);

      expect(response.status).toBe(422);
      const data = await response.json();
      expect(data).toHaveProperty("error", "Invalid input");
    });
  });

  describe("PUT /api/team-members", () => {
    it("should update a team member's basic information", async () => {
      const user = await createTestUser({
        email: `update-test-${Date.now()}@example.com`,
      });
      createdUserIds.push(user.id);

      const role = await createTestRole("ADMIN");
      await prisma.userRole.create({
        data: {
          user_id: user.id,
          role_id: role.id,
        },
      });

      const updateData = {
        id: user.id,
        email: `updated-email-${Date.now()}@example.com`,
      };

      const request = createRequestWithBody("/api/team-members", updateData, {
        method: "PUT",
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.email).toBe(updateData.email);
    });

    it("should update clinician with all related data", async () => {
      // Create initial clinician
      const user = await createTestUser({
        email: `update-clinician-${Date.now()}@example.com`,
      });
      createdUserIds.push(user.id);

      const basicRole = await createTestRole("CLINICIAN.BASIC");
      await createTestRole("CLINICIAN.FULL");

      await prisma.userRole.create({
        data: {
          user_id: user.id,
          role_id: basicRole.id,
        },
      });

      const clinician = await createTestClinician(user.id, {
        first_name: "Old",
        last_name: "Name",
      });

      // Create initial clinical info
      await prisma.clinicalInfo.create({
        data: {
          user_id: user.id,
          speciality: "General",
          taxonomy_code: "",
          NPI_number: 1111111111,
        },
      });

      // Create initial license
      await prisma.license.create({
        data: {
          clinician_id: clinician.id,
          license_type: "Medical",
          license_number: "OLD123",
          expiration_date: new Date("2025-12-31"),
          state: "CA",
        },
      });

      // Create services
      const service1 = await createTestService("Update Service 1");
      const service2 = await createTestService("Update Service 2");
      createdServiceIds.push(service1.id, service2.id);

      // Update the clinician
      const updateData = {
        id: user.id,
        firstName: "Updated",
        lastName: "Doctor",
        roles: ["CLINICIAN.FULL"],
        specialty: "Neurology",
        npiNumber: "2222222222",
        license: {
          type: "Medical",
          number: "UPDATED456",
          expirationDate: "2027-12-31",
          state: "NY",
        },
        services: [service1.id, service2.id],
      };

      const request = createRequestWithBody("/api/team-members", updateData, {
        method: "PUT",
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.UserRole[0].Role.name).toBe("CLINICIAN.FULL");
      expect(data.Clinician.first_name).toBe("Updated");
      expect(data.Clinician.last_name).toBe("Doctor");
      expect(data.Clinician.License[0].license_number).toBe("UPDATED456");
      expect(data.Clinician.License[0].state).toBe("NY");
      expect(data.Clinician.ClinicianServices).toHaveLength(2);
      expect(data.clinicalInfos[0].speciality).toBe("Neurology");
      expect(data.clinicalInfos[0].NPI_number).toBe(2222222222);
    });

    it("should create clinician record when changing role to clinician", async () => {
      const user = await createTestUser({
        email: `admin-to-clinician-${Date.now()}@example.com`,
      });
      createdUserIds.push(user.id);

      const adminRole = await createTestRole("ADMIN");
      await createTestRole("CLINICIAN.BASIC");

      await prisma.userRole.create({
        data: {
          user_id: user.id,
          role_id: adminRole.id,
        },
      });

      const updateData = {
        id: user.id,
        roles: ["CLINICIAN.BASIC"],
        firstName: "New",
        lastName: "Clinician",
      };

      const request = createRequestWithBody("/api/team-members", updateData, {
        method: "PUT",
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.UserRole[0].Role.name).toBe("CLINICIAN.BASIC");
      expect(data.Clinician).toBeDefined();
      expect(data.Clinician.first_name).toBe("New");
      expect(data.Clinician.last_name).toBe("Clinician");
    });

    it("should return 404 if user doesn't exist", async () => {
      const updateData = {
        id: "non-existent-id",
        email: "test@example.com",
      };

      const request = createRequestWithBody("/api/team-members", updateData, {
        method: "PUT",
      });
      const response = await PUT(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toHaveProperty("error", "User not found");
    });

    it("should return 409 if email already in use", async () => {
      const user1 = await createTestUser({
        email: `user1-${Date.now()}@example.com`,
      });
      const user2 = await createTestUser({
        email: `user2-${Date.now()}@example.com`,
      });
      createdUserIds.push(user1.id, user2.id);

      const updateData = {
        id: user1.id,
        email: "user2@example.com",
      };

      const request = createRequestWithBody("/api/team-members", updateData, {
        method: "PUT",
      });
      const response = await PUT(request);

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data).toHaveProperty("error", "Email already in use");
    });
  });

  describe("DELETE /api/team-members", () => {
    it("should soft delete a user", async () => {
      const user = await createTestUser({
        email: `delete-test-${Date.now()}@example.com`,
      });
      createdUserIds.push(user.id);

      const request = createRequest(`/api/team-members?id=${user.id}`, {
        method: "DELETE",
      });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("success", true);

      // Verify user was soft deleted
      const deletedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      expect(deletedUser?.email).toContain("DELETED-");
      expect(deletedUser?.password_hash).toBe("DELETED");
    });

    it("should mark clinician as inactive when deleting", async () => {
      const user = await createTestUser({
        email: `delete-clinician-${Date.now()}@example.com`,
      });
      createdUserIds.push(user.id);

      const role = await createTestRole("CLINICIAN.BASIC");
      await prisma.userRole.create({
        data: {
          user_id: user.id,
          role_id: role.id,
        },
      });

      const clinician = await createTestClinician(user.id);

      const request = createRequest(`/api/team-members?id=${user.id}`, {
        method: "DELETE",
      });
      const response = await DELETE(request);

      expect(response.status).toBe(200);

      // Verify clinician was marked inactive
      const deletedClinician = await prisma.clinician.findUnique({
        where: { id: clinician.id },
      });
      expect(deletedClinician?.is_active).toBe(false);
    });

    it("should return 400 if no ID provided", async () => {
      const request = createRequest("/api/team-members", {
        method: "DELETE",
      });
      const response = await DELETE(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty("error", "User ID is required");
    });

    it("should return 404 if user doesn't exist", async () => {
      const request = createRequest("/api/team-members?id=non-existent-id", {
        method: "DELETE",
      });
      const response = await DELETE(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toHaveProperty("error", "User not found");
    });
  });
});
