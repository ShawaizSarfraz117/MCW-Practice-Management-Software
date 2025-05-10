/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-lines-per-function */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  GET,
  POST,
  PUT,
  DELETE,
} from "../../../src/app/api/team-members/route";
import { prisma } from "@mcw/database";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { v4 as uuidv4 } from "uuid";
import { hash } from "bcrypt";

// Mock the authentication session
vi.mock("../../../src/utils/helpers", () => ({
  getBackOfficeSession: vi.fn(() =>
    Promise.resolve({
      user: {
        id: "test-user-id",
        email: "test@example.com",
      },
    }),
  ),
}));

describe("Team Members API Integration Tests", () => {
  // Test data
  let testRoleAdmin: { id: string; name: string };
  let testRoleClinician: { id: string; name: string };
  let testRoleFullAccess: { id: string; name: string };
  let testUsers: Array<{ id: string; email: string }> = [];

  beforeEach(async () => {
    // Clean up data from previous tests
    // First delete user roles (which depend on users)
    await prisma.userRole.deleteMany({
      where: {
        user_id: {
          in: testUsers.map((u) => u.id),
        },
      },
    });

    // Next delete clinicians (which depend on users)
    await prisma.clinician.deleteMany({
      where: {
        OR: [
          { user_id: { in: testUsers.map((u) => u.id) } },
          { first_name: { contains: "Test" } },
          { last_name: { contains: "Test" } },
        ],
      },
    });

    // Finally delete the users
    if (testUsers.length > 0) {
      await prisma.user.deleteMany({
        where: {
          id: { in: testUsers.map((u) => u.id) },
        },
      });
    }

    // Also clean up any existing test users by email pattern
    // First find all users with test email pattern
    const existingTestUsers = await prisma.user.findMany({
      where: {
        email: { contains: "test-team-member" },
      },
      select: { id: true },
    });

    const existingTestUserIds = existingTestUsers.map((u) => u.id);

    // Delete their user roles first
    if (existingTestUserIds.length > 0) {
      await prisma.userRole.deleteMany({
        where: {
          user_id: { in: existingTestUserIds },
        },
      });

      // Then delete any associated clinician records
      await prisma.clinician.deleteMany({
        where: {
          user_id: { in: existingTestUserIds },
        },
      });

      // Finally delete the users
      await prisma.user.deleteMany({
        where: {
          id: { in: existingTestUserIds },
        },
      });
    }

    testUsers = [];

    // Create test roles if they don't exist
    const adminRole = await prisma.role.upsert({
      where: { name: "Admin" },
      update: {},
      create: {
        id: uuidv4(),
        name: "Admin",
      },
    });
    testRoleAdmin = adminRole;

    const clinicianRole = await prisma.role.upsert({
      where: { name: "Clinician" },
      update: {},
      create: {
        id: uuidv4(),
        name: "Clinician",
      },
    });
    testRoleClinician = clinicianRole;

    const fullAccessRole = await prisma.role.upsert({
      where: { name: "FullAccess" },
      update: {},
      create: {
        id: uuidv4(),
        name: "FullAccess",
      },
    });
    testRoleFullAccess = fullAccessRole;

    // Create test team members
    await createTestUser("admin", [testRoleAdmin.id]);
    await createTestUser("clinician", [testRoleClinician.id], true);
    await createTestUser(
      "clinician-full",
      [testRoleClinician.id, testRoleFullAccess.id],
      true,
    );
  });

  // Helper function to create test users
  async function createTestUser(
    type: string,
    roleIds: string[],
    isClinician = false,
  ) {
    const userId = uuidv4();
    const email = `test-team-member-${type}-${Date.now()}@example.com`;
    const passwordHash = await hash("password123", 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        id: userId,
        email,
        password_hash: passwordHash,
      },
    });

    // Add roles
    for (const roleId of roleIds) {
      await prisma.userRole.create({
        data: {
          user_id: userId,
          role_id: roleId,
        },
      });
    }

    // Create clinician if needed
    if (isClinician) {
      await prisma.clinician.create({
        data: {
          id: uuidv4(),
          user_id: userId,
          first_name: `Test${type.charAt(0).toUpperCase() + type.slice(1)}`,
          last_name: "User",
          address: "123 Test St",
          percentage_split: 50,
        },
      });
    }

    testUsers.push({ id: userId, email });
    return user;
  }

  describe("GET /api/team-members", () => {
    it("should return a list of team members", async () => {
      const request = createRequest("/api/team-members");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("data");
      expect(data).toHaveProperty("pagination");
      expect(Array.isArray(data.data)).toBe(true);

      // Verify our test users are present
      const adminEmail = testUsers.find((u) =>
        u.email.includes("admin"),
      )?.email;
      const clinicianEmail = testUsers.find(
        (u) => u.email.includes("clinician") && !u.email.includes("full"),
      )?.email;

      expect(data.data.some((user: any) => user.email === adminEmail)).toBe(
        true,
      );
      expect(data.data.some((user: any) => user.email === clinicianEmail)).toBe(
        true,
      );
    });

    it("should filter by role", async () => {
      const request = createRequest(
        `/api/team-members?role=${testRoleAdmin.name}`,
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      // Only admin users should be present
      const adminEmail = testUsers.find((u) =>
        u.email.includes("admin"),
      )?.email;
      expect(data.data.some((user: any) => user.email === adminEmail)).toBe(
        true,
      );

      // No clinician users should be present
      const clinicianEmails = testUsers
        .filter((u) => u.email.includes("clinician"))
        .map((u) => u.email);
      for (const email of clinicianEmails) {
        expect(data.data.every((user: any) => user.email !== email)).toBe(true);
      }
    });

    it("should filter by search term", async () => {
      // Create a user with a distinctive name to search for
      await createTestUser("searchable", [testRoleAdmin.id]);
      const searchableEmail = testUsers.find((u) =>
        u.email.includes("searchable"),
      )?.email;

      const request = createRequest(`/api/team-members?search=searchable`);
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(
        data.data.some((user: any) => user.email === searchableEmail),
      ).toBe(true);
      expect(data.data.length).toBeLessThan(testUsers.length);
    });

    it("should paginate results", async () => {
      // Create a few more users to ensure we have enough for pagination
      for (let i = 0; i < 5; i++) {
        await createTestUser(`pagination-${i}`, [testRoleAdmin.id]);
      }

      const request = createRequest("/api/team-members?page=1&pageSize=3");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data.length).toBeLessThanOrEqual(3);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.pageSize).toBe(3);
      expect(data.pagination.total).toBeGreaterThanOrEqual(testUsers.length);
      expect(data.pagination.totalPages).toBeGreaterThan(1);
    });
  });

  describe("POST /api/team-members", () => {
    it("should create a new non-clinician team member", async () => {
      const newUser = {
        email: `test-team-member-new-${Date.now()}@example.com`,
        firstName: "NewTest",
        lastName: "User",
        password: "password123",
        roleIds: [testRoleAdmin.id],
        isClinician: false,
      };

      const request = createRequestWithBody("/api/team-members", newUser);
      const response = await POST(request);

      expect(response.status).toBe(201);
      const createdUser = await response.json();

      expect(createdUser).toHaveProperty("id");
      expect(createdUser.email).toBe(newUser.email);

      // Verify in database
      const dbUser = await prisma.user.findUnique({
        where: { id: createdUser.id },
        include: {
          UserRole: {
            include: { Role: true },
          },
        },
      });

      expect(dbUser).not.toBeNull();
      expect(dbUser?.email).toBe(newUser.email);
      expect(
        dbUser?.UserRole.some((ur) => ur.role_id === testRoleAdmin.id),
      ).toBe(true);

      // Clean up
      testUsers.push({ id: createdUser.id, email: createdUser.email });
    });

    it("should create a new clinician team member", async () => {
      const newUser = {
        email: `test-team-member-new-clinician-${Date.now()}@example.com`,
        firstName: "NewClinician",
        lastName: "User",
        password: "password123",
        roleIds: [testRoleClinician.id],
        isClinician: true,
        clinicianInfo: {
          address: "456 Clinic Ave",
          percentageSplit: 75,
        },
      };

      const request = createRequestWithBody("/api/team-members", newUser);
      const response = await POST(request);

      expect(response.status).toBe(201);
      const createdUser = await response.json();

      expect(createdUser).toHaveProperty("id");
      expect(createdUser.email).toBe(newUser.email);

      // Verify in database
      const dbUser = await prisma.user.findUnique({
        where: { id: createdUser.id },
        include: {
          UserRole: true,
          Clinician: true,
        },
      });

      expect(dbUser).not.toBeNull();
      expect(dbUser?.Clinician).not.toBeNull();
      expect(dbUser?.Clinician?.first_name).toBe(newUser.firstName);
      expect(dbUser?.Clinician?.last_name).toBe(newUser.lastName);
      expect(dbUser?.Clinician?.address).toBe(newUser.clinicianInfo.address);
      expect(dbUser?.Clinician?.percentage_split).toBe(
        newUser.clinicianInfo.percentageSplit,
      );

      // Clean up
      testUsers.push({ id: createdUser.id, email: createdUser.email });
    });

    it("should reject creation with duplicate email", async () => {
      const existingEmail = testUsers[0].email;

      const newUser = {
        email: existingEmail,
        firstName: "Duplicate",
        lastName: "User",
        password: "password123",
        roleIds: [testRoleAdmin.id],
        isClinician: false,
      };

      const request = createRequestWithBody("/api/team-members", newUser);
      const response = await POST(request);

      expect(response.status).toBe(409);
      const error = await response.json();
      expect(error).toHaveProperty(
        "error",
        "User with this email already exists",
      );
    });
  });

  describe("PUT /api/team-members", () => {
    it("should update a team member's email", async () => {
      const user = testUsers[0];
      const newEmail = `updated-${Date.now()}@example.com`;

      const updateData = {
        id: user.id,
        email: newEmail,
      };

      const request = createRequestWithBody("/api/team-members", updateData, {
        method: "PUT",
      });
      const response = await PUT(request);

      expect(response.status).toBe(200);
      const updatedUser = await response.json();

      expect(updatedUser.id).toBe(user.id);
      expect(updatedUser.email).toBe(newEmail);

      // Verify in database
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      expect(dbUser?.email).toBe(newEmail);
    });

    it("should update a clinician's information", async () => {
      // Find a clinician user
      const clinicianIndex = testUsers.findIndex((u) =>
        u.email.includes("clinician"),
      );
      if (clinicianIndex === -1) {
        throw new Error("Test setup failed - no clinician user found");
      }

      const user = testUsers[clinicianIndex];

      // Get the current clinician record
      const initialUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { Clinician: true },
      });

      const clinicianId = initialUser?.Clinician?.id;

      const updateData = {
        id: user.id,
        firstName: "UpdatedClinician",
        lastName: "NewLastName",
        isClinician: true,
        clinicianInfo: {
          address: "999 Updated Ave",
          percentageSplit: 85,
        },
      };

      const request = createRequestWithBody("/api/team-members", updateData, {
        method: "PUT",
      });
      const response = await PUT(request);

      expect(response.status).toBe(200);

      // Verify in database
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { Clinician: true },
      });

      expect(dbUser?.Clinician?.id).toBe(clinicianId); // Same clinician ID
      expect(dbUser?.Clinician?.first_name).toBe(updateData.firstName);
      expect(dbUser?.Clinician?.last_name).toBe(updateData.lastName);
      expect(dbUser?.Clinician?.address).toBe(updateData.clinicianInfo.address);
      expect(dbUser?.Clinician?.percentage_split).toBe(
        updateData.clinicianInfo.percentageSplit,
      );
    });

    it("should mark a clinician as inactive when changing to non-clinician", async () => {
      // Find a clinician user
      const clinicianIndex = testUsers.findIndex((u) =>
        u.email.includes("clinician"),
      );
      if (clinicianIndex === -1) {
        throw new Error("Test setup failed - no clinician user found");
      }

      const user = testUsers[clinicianIndex];

      // Get the current clinician record
      const initialUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { Clinician: true },
      });

      const clinicianId = initialUser?.Clinician?.id;

      const updateData = {
        id: user.id,
        isClinician: false,
        roleIds: [testRoleAdmin.id],
      };

      const request = createRequestWithBody("/api/team-members", updateData, {
        method: "PUT",
      });
      const response = await PUT(request);

      expect(response.status).toBe(200);

      // Verify in database that clinician is marked inactive
      const dbClinician = await prisma.clinician.findUnique({
        where: { id: clinicianId },
      });

      expect(dbClinician).not.toBeNull();
      expect(dbClinician?.is_active).toBe(false);
    });

    it("should reject update with non-existent user ID", async () => {
      const updateData = {
        id: uuidv4(), // Random non-existent ID
        email: "nonexistent@example.com",
      };

      const request = createRequestWithBody("/api/team-members", updateData, {
        method: "PUT",
      });
      const response = await PUT(request);

      expect(response.status).toBe(404);
      const error = await response.json();
      expect(error).toHaveProperty("error", "User not found");
    });
  });

  describe("DELETE /api/team-members", () => {
    it("should soft-delete a team member", async () => {
      // Use the first test user for deletion
      const user = testUsers[0];

      const request = createRequest(`/api/team-members?id=${user.id}`, {
        method: "DELETE",
      });
      const response = await DELETE(request);

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty("success", true);

      // Verify user is soft-deleted (email is modified)
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      expect(dbUser).not.toBeNull();
      expect(dbUser?.email).toContain("DELETED");
      expect(dbUser?.password_hash).toBe("DELETED");
    });

    it("should mark associated clinician as inactive when deleting", async () => {
      // Find a clinician user
      const clinicianIndex = testUsers.findIndex((u) =>
        u.email.includes("clinician"),
      );
      if (clinicianIndex === -1) {
        throw new Error("Test setup failed - no clinician user found");
      }

      const user = testUsers[clinicianIndex];

      // Get the current clinician record
      const initialUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { Clinician: true },
      });

      const clinicianId = initialUser?.Clinician?.id;
      expect(initialUser?.Clinician?.is_active).toBe(true);

      const request = createRequest(`/api/team-members?id=${user.id}`, {
        method: "DELETE",
      });
      const response = await DELETE(request);

      expect(response.status).toBe(200);

      // Verify clinician is marked inactive
      const dbClinician = await prisma.clinician.findUnique({
        where: { id: clinicianId },
      });

      expect(dbClinician).not.toBeNull();
      expect(dbClinician?.is_active).toBe(false);
    });

    it("should reject deletion with non-existent user ID", async () => {
      const nonExistentId = uuidv4();
      const request = createRequest(`/api/team-members?id=${nonExistentId}`, {
        method: "DELETE",
      });
      const response = await DELETE(request);

      expect(response.status).toBe(404);
      const error = await response.json();
      expect(error).toHaveProperty("error", "User not found");
    });
  });
});
