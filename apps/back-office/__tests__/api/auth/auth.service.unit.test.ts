import { vi } from "vitest";
import { describe, it, expect, beforeEach } from "vitest";
import { authorize } from "@/api/auth/[...nextauth]/auth.service";
import prismaMock from "@mcw/database/mock";
import bcrypt from "bcrypt";
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
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: "test@test.com" },
      }),
    );
  });

  it("should return null when password is invalid", async () => {
    const hashedPassword = await bcrypt.hash("correctpass", 10);
    const mockUser = UserFactory.build({
      password_hash: hashedPassword,
      UserRole: [
        {
          Role: {
            name: "ADMIN",
          },
        },
      ],
    });

    prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);

    const credentials: Credentials = {
      email: mockUser.email,
      password: "wrongpass",
    };

    const result = await authorize(credentials, mockRequest);

    expect(result).toBeNull();
    expect(prismaMock.user.findUnique).toHaveBeenCalled();
  });

  it("should return user data when credentials are valid", async () => {
    // Arrange
    const testData = {
      password: "correctpass",
      email: "test@example.com",
    };
    const hashedPassword = await bcrypt.hash(testData.password, 10);
    const mockUser = UserFactory.build({
      email: testData.email,
      password_hash: hashedPassword,
      UserRole: [{ Role: { name: "ADMIN" } }],
    });

    prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);
    prismaMock.user.update.mockResolvedValueOnce(mockUser);

    // Act
    const result = await authorize(
      { email: testData.email, password: testData.password },
      mockRequest,
    );

    // Assert
    expect(result).toMatchObject({
      id: mockUser.id,
      email: testData.email,
      roles: ["ADMIN"],
    });

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: mockUser.id },
        data: { last_login: expect.any(Date) },
      }),
    );
  });

  it("should return all user roles when user has multiple roles", async () => {
    // Arrange
    const testData = {
      password: "correctpass",
      email: "test@example.com",
    };
    const hashedPassword = await bcrypt.hash(testData.password, 10);
    const mockUser = UserFactory.build({
      email: testData.email,
      password_hash: hashedPassword,
      UserRole: [{ Role: { name: "ADMIN" } }, { Role: { name: "DOCTOR" } }],
    });

    prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);
    prismaMock.user.update.mockResolvedValueOnce(mockUser);

    // Act
    const result = await authorize(
      { email: testData.email, password: testData.password },
      mockRequest,
    );

    // Assert
    expect(result).toMatchObject({
      id: mockUser.id,
      email: testData.email,
      roles: expect.arrayContaining(["ADMIN", "DOCTOR"]),
    });
  });

  it("should return empty roles array when user has no roles", async () => {
    // Arrange
    const testData = {
      password: "correctpass",
      email: "test@example.com",
    };
    const hashedPassword = await bcrypt.hash(testData.password, 10);
    const mockUser = UserFactory.build({
      email: testData.email,
      password_hash: hashedPassword,
      UserRole: [], // User with no roles
    });

    prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);
    prismaMock.user.update.mockResolvedValueOnce(mockUser);

    // Act
    const result = await authorize(
      { email: testData.email, password: testData.password },
      mockRequest,
    );

    // Assert
    expect(result).toMatchObject({
      id: mockUser.id,
      email: testData.email,
      roles: [],
    });
  });
});
