import { vi } from "vitest";
import { describe, it, expect, beforeEach } from "vitest";
import { authorize } from "@/api/auth/[...nextauth]/auth.service";
import prismaMock from "@mcw/database/mock";
import bcrypt from "bcryptjs";
import { UserFactory } from "@mcw/database/mock-data";
import type { RequestInternal } from "next-auth";

type Credentials = Record<"email" | "password", string> | undefined;

// Mock request object that matches the expected type
const mockRequest: Pick<
  RequestInternal,
  "query" | "body" | "headers" | "method"
> = {
  query: {},
  body: {},
  headers: {},
  method: "POST",
};

describe("Auth Service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return null when credentials are missing", async () => {
    const result = await authorize(undefined, mockRequest);
    expect(result).toBeNull();
  });

  it("should return null when email is missing", async () => {
    const credentials = { password: "test123" } as Credentials;
    const result = await authorize(credentials, mockRequest);
    expect(result).toBeNull();
  });

  it("should return null when password is missing", async () => {
    const credentials = { email: "test@test.com" } as Credentials;
    const result = await authorize(credentials, mockRequest);
    expect(result).toBeNull();
  });

  it("should return null when user is not found", async () => {
    // Mock findUnique to return null (user not found)
    prismaMock.user.findUnique.mockResolvedValueOnce(null);

    const credentials: Credentials = {
      email: "test@test.com",
      password: "test123",
    };
    const result = await authorize(credentials, mockRequest);
    expect(result).toBeNull();
  });

  it("should return null when password is invalid", async () => {
    const testData = {
      email: "test@test.com",
      password: "test123",
      hashedPassword: await bcrypt.hash("different123", 10),
    };

    const mockUser = {
      ...UserFactory.build({
        email: testData.email,
        password_hash: testData.hashedPassword,
      }),
      UserRole: [], // Add UserRole for consistency with Prisma's include behavior
    };

    // Mock findUnique to return the user
    prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);

    const credentials: Credentials = {
      email: testData.email,
      password: testData.password,
    };
    const result = await authorize(credentials, mockRequest);
    expect(result).toBeNull();
  });

  it("should return user data when credentials are valid", async () => {
    const testData = {
      email: "test@test.com",
      password: "test123",
      hashedPassword: await bcrypt.hash("test123", 10),
    };

    const mockUser = {
      ...UserFactory.build({
        email: testData.email,
        password_hash: testData.hashedPassword,
      }),
      UserRole: [], // Add empty UserRole array to match the expected structure
    };

    // Mock findUnique to return the user
    prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);

    const credentials: Credentials = {
      email: testData.email,
      password: testData.password,
    };
    const result = await authorize(credentials, mockRequest);

    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      id: mockUser.id,
      email: testData.email,
      roles: [],
    });
  });

  it("should return all user roles when user has multiple roles", async () => {
    const testData = {
      email: "test@test.com",
      password: "test123",
      hashedPassword: await bcrypt.hash("test123", 10),
    };

    const mockUser = {
      ...UserFactory.build({
        email: testData.email,
        password_hash: testData.hashedPassword,
      }),
      UserRole: [
        {
          Role: {
            id: "role1",
            name: "Admin",
            is_active: true,
            permissions: [],
            UserRole: [],
          },
        },
        {
          Role: {
            id: "role2",
            name: "User",
            is_active: true,
            permissions: [],
            UserRole: [],
          },
        },
      ],
    };

    // Mock findUnique to return the user with roles
    prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);

    const credentials: Credentials = {
      email: testData.email,
      password: testData.password,
    };
    const result = await authorize(credentials, mockRequest);

    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      id: mockUser.id,
      email: testData.email,
      roles: ["Admin", "User"],
    });
  });

  it("should return empty roles array when user has no roles", async () => {
    const testData = {
      email: "test@test.com",
      password: "test123",
      hashedPassword: await bcrypt.hash("test123", 10),
    };

    const mockUser = {
      ...UserFactory.build({
        email: testData.email,
        password_hash: testData.hashedPassword,
      }),
      UserRole: [],
    };

    // Mock findUnique to return the user
    prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);

    const credentials: Credentials = {
      email: testData.email,
      password: testData.password,
    };
    const result = await authorize(credentials, mockRequest);

    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      id: mockUser.id,
      email: testData.email,
      roles: [],
    });
  });
});