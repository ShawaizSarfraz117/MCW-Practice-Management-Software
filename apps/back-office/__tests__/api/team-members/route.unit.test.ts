/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
import { vi, describe, it, expect, beforeEach } from "vitest";
import { GET, POST, PUT, DELETE } from "@/api/team-members/route";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import prismaMock from "@mcw/database/mock";
import { getBackOfficeSession } from "@/utils/helpers";

// Disable TypeScript explicit-any for mocks
/* eslint-disable @typescript-eslint/no-explicit-any */

// Define interfaces for mock objects
interface MockRole {
  id: string;
  name: string;
  description: string | null;
  [key: string]: any;
}

interface MockUserRole {
  user_id: string;
  role_id: string;
  Role?: MockRole;
  [key: string]: any;
}

interface MockLicense {
  id: string;
  license_type: string;
  license_number: string;
  expiration_date: Date;
  state: string;
  [key: string]: any;
}

interface MockPracticeService {
  id: string;
  name: string;
  [key: string]: any;
}

interface MockClinicianService {
  clinician_id: string;
  service_id: string;
  is_active: boolean;
  PracticeService?: MockPracticeService;
  [key: string]: any;
}

interface MockClinician {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  address: string;
  percentage_split: number;
  is_active: boolean;
  speciality: string | null;
  NPI_number: string | null;
  taxonomy_code: string | null;
  License?: MockLicense[];
  ClinicianServices?: MockClinicianService[];
  [key: string]: any;
}

interface MockClinicalInfo {
  id: string;
  user_id: string;
  speciality: string;
  taxonomy_code: string;
  NPI_number: number;
  [key: string]: any;
}

interface MockUser {
  id: string;
  email: string;
  password_hash: string;
  last_login: Date | null;
  date_of_birth: Date | null;
  phone: string | null;
  profile_photo: string | null;
  UserRole?: MockUserRole[];
  Clinician?: MockClinician | null;
  clinicalInfos?: MockClinicalInfo[];
  [key: string]: any;
}

// Mock logger to prevent console output during tests
vi.mock("@mcw/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
  getDbLogger: vi.fn(() => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  })),
}));

// Mock Next.js auth helper
vi.mock("@/utils/helpers", () => ({
  getBackOfficeSession: vi.fn(),
}));

// Mock bcryptjs for password hashing
vi.mock("bcryptjs", () => ({
  hash: vi.fn(async () => "hashed_password"),
}));

// Mock ROLE_NAME_MAP from @mcw/types
vi.mock("@mcw/types", () => ({
  ROLE_NAME_MAP: {
    Clinician: "Clinician",
    Admin: "Admin",
    "CLINICIAN.BASIC": "CLINICIAN.BASIC",
    "CLINICIAN.FULL": "CLINICIAN.FULL",
  },
}));

// Helper function to create a mock user with necessary relationship properties
const mockUser = (overrides = {}): MockUser => ({
  id: "mock-user-id",
  email: "mock-user@example.com",
  password_hash: "hashed_password",
  last_login: new Date(),
  date_of_birth: null,
  phone: null,
  profile_photo: null,
  UserRole: [],
  Clinician: null,
  clinicalInfos: [],
  ...overrides,
});

// Helper function to create a mock role
const mockRole = (overrides = {}): MockRole => ({
  id: "mock-role-id",
  name: "Admin",
  description: null,
  ...overrides,
});

// Helper function to create a mock user role
const mockUserRole = (overrides = {}): MockUserRole => ({
  user_id: "mock-user-id",
  role_id: "mock-role-id",
  ...overrides,
});

// Helper function to create a mock clinician
const mockClinician = (overrides = {}): MockClinician => ({
  id: "mock-clinician-id",
  user_id: "mock-user-id",
  first_name: "Mock",
  last_name: "Clinician",
  address: "123 Test St",
  percentage_split: 50,
  is_active: true,
  speciality: null,
  NPI_number: null,
  taxonomy_code: null,
  License: [],
  ClinicianServices: [],
  ...overrides,
});

// Helper function to create a mock license
const mockLicense = (overrides = {}): MockLicense => ({
  id: "mock-license-id",
  license_type: "Medical",
  license_number: "123456",
  expiration_date: new Date("2025-12-31"),
  state: "CA",
  ...overrides,
});

// Helper function to create a mock practice service
const mockPracticeService = (overrides = {}): MockPracticeService => ({
  id: "mock-service-id",
  name: "Therapy",
  ...overrides,
});

// Helper function to create a mock clinician service
const mockClinicianService = (overrides = {}): MockClinicianService => ({
  clinician_id: "mock-clinician-id",
  service_id: "mock-service-id",
  is_active: true,
  ...overrides,
});

// Helper function to create a mock clinical info
const mockClinicalInfo = (overrides = {}): MockClinicalInfo => ({
  id: "mock-clinical-info-id",
  user_id: "mock-user-id",
  speciality: "Psychiatry",
  taxonomy_code: "2084P0800X",
  NPI_number: 1234567890,
  ...overrides,
});

describe("Team Members API Unit Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Mock authenticated session for all tests
    (getBackOfficeSession as any).mockResolvedValue({
      user: {
        id: "test-user-id",
        email: "test@example.com",
      },
    });
  });

  describe("GET /api/team-members", () => {
    it("should return a list of team members with pagination", async () => {
      // Mock user data
      const mockUsers = [
        {
          ...mockUser({ id: "user-1", email: "admin@example.com" }),
          UserRole: [
            {
              ...mockUserRole({ role_id: "role-admin" }),
              Role: mockRole({ id: "role-admin", name: "Admin" }),
            },
          ],
          Clinician: null,
          clinicalInfos: [],
        } as MockUser,
        {
          ...mockUser({ id: "user-2", email: "clinician@example.com" }),
          UserRole: [
            {
              ...mockUserRole({ role_id: "role-clinician" }),
              Role: mockRole({ id: "role-clinician", name: "CLINICIAN.BASIC" }),
            },
          ],
          Clinician: mockClinician({
            user_id: "user-2",
            first_name: "John",
            last_name: "Doe",
            License: [],
            ClinicianServices: [],
          }) as MockClinician,
          clinicalInfos: [],
        } as MockUser,
      ];

      // Set up mocks
      prismaMock.user.findMany.mockResolvedValueOnce(mockUsers);
      prismaMock.user.count.mockResolvedValueOnce(2);

      // Create request
      const request = createRequest("/api/team-members");
      const response = await GET(request);
      const data = await response.json();

      // Assert response
      expect(response.status).toBe(200);
      expect(data).toHaveProperty("data");
      expect(data).toHaveProperty("pagination");
      expect(data.data).toHaveLength(2);

      // Verify pagination
      expect(data.pagination.total).toBe(2);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.pageSize).toBe(20);
    });

    it("should return team members with complete clinician data including licenses and services", async () => {
      // Mock user data with complete clinician information
      const mockUsers = [
        {
          ...mockUser({ id: "user-3", email: "dr.smith@example.com" }),
          UserRole: [
            {
              ...mockUserRole({ role_id: "role-clinician" }),
              Role: mockRole({ id: "role-clinician", name: "CLINICIAN.FULL" }),
            },
          ],
          Clinician: mockClinician({
            user_id: "user-3",
            first_name: "Dr",
            last_name: "Smith",
            License: [
              mockLicense({
                id: "license-1",
                license_type: "Medical",
                license_number: "MD123456",
                state: "CA",
              }),
            ],
            ClinicianServices: [
              {
                ...mockClinicianService(),
                PracticeService: mockPracticeService({
                  id: "service-1",
                  name: "Individual Therapy",
                }),
              },
              {
                ...mockClinicianService({
                  service_id: "service-2",
                }),
                PracticeService: mockPracticeService({
                  id: "service-2",
                  name: "Group Therapy",
                }),
              },
            ],
          }) as MockClinician,
          clinicalInfos: [
            mockClinicalInfo({
              speciality: "Psychiatry",
              NPI_number: 1234567890,
            }),
          ],
        } as MockUser,
      ];

      // Set up mocks
      prismaMock.user.findMany.mockResolvedValueOnce(mockUsers);
      prismaMock.user.count.mockResolvedValueOnce(1);

      // Create request
      const request = createRequest("/api/team-members");
      const response = await GET(request);
      const data = await response.json();

      // Assert response
      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);

      const clinician = data.data[0];
      expect(clinician.Clinician).toBeTruthy();
      expect(clinician.Clinician.License).toHaveLength(1);
      expect(clinician.Clinician.License[0].license_number).toBe("MD123456");
      expect(clinician.Clinician.ClinicianServices).toHaveLength(2);
      expect(clinician.clinicalInfos).toHaveLength(1);
      expect(clinician.clinicalInfos[0].speciality).toBe("Psychiatry");
    });

    it("should filter by search term", async () => {
      // Mock findMany with search filter
      prismaMock.user.findMany.mockResolvedValueOnce([
        {
          ...mockUser({ id: "user-1", email: "john@example.com" }),
          UserRole: [
            {
              ...mockUserRole(),
              Role: mockRole(),
            },
          ],
          Clinician: mockClinician({
            first_name: "John",
            last_name: "Doe",
          }) as MockClinician,
        } as MockUser,
      ]);
      prismaMock.user.count.mockResolvedValueOnce(1);

      // Create request with search
      const request = createRequest("/api/team-members?search=john");
      const response = await GET(request);
      const data = await response.json();

      // Assert response
      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].email).toBe("john@example.com");

      // Verify search was applied
      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { email: { contains: "john" } },
              { Clinician: { first_name: { contains: "john" } } },
              { Clinician: { last_name: { contains: "john" } } },
            ]),
          }),
        }),
      );
    });

    it("should filter by role", async () => {
      // Mock findMany with role filter
      prismaMock.user.findMany.mockResolvedValueOnce([
        {
          ...mockUser(),
          UserRole: [
            {
              ...mockUserRole(),
              Role: mockRole({ name: "Clinician" }),
            },
          ],
          Clinician: mockClinician() as MockClinician,
        } as MockUser,
      ]);
      prismaMock.user.count.mockResolvedValueOnce(1);

      // Create request with role filter
      const request = createRequest("/api/team-members?role=Clinician");
      const response = await GET(request);
      const data = await response.json();

      // Assert response
      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);

      // Verify role filter was applied
      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            UserRole: {
              some: {
                Role: {
                  name: "Clinician",
                },
              },
            },
          }),
        }),
      );
    });

    it("should handle pagination", async () => {
      // Mock findMany with pagination
      prismaMock.user.findMany.mockResolvedValueOnce([mockUser()]);
      prismaMock.user.count.mockResolvedValueOnce(30);

      // Create request with pagination
      const request = createRequest("/api/team-members?page=2&pageSize=10");
      const response = await GET(request);
      const data = await response.json();

      // Assert pagination values
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.pageSize).toBe(10);
      expect(data.pagination.total).toBe(30);
      expect(data.pagination.totalPages).toBe(3);

      // Verify pagination was applied
      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });

    it("should return 401 if user is not authenticated", async () => {
      // Mock unauthenticated session
      (getBackOfficeSession as any).mockResolvedValueOnce(null);

      const request = createRequest("/api/team-members");
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty("error", "Unauthorized");
    });
  });

  describe("POST /api/team-members", () => {
    it("should create a new non-clinician team member", async () => {
      // Mock user creation
      const newUserId = "new-user-id";

      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      // Mock role finding
      prismaMock.role.findMany.mockResolvedValueOnce([
        mockRole({ id: "role-admin", name: "Admin", description: null }),
      ]);

      prismaMock.$transaction.mockImplementationOnce(async (callback) => {
        const mockNewUser = mockUser({ id: newUserId });
        prismaMock.user.create.mockResolvedValueOnce(mockNewUser);
        return await callback(prismaMock);
      });

      prismaMock.user.findUnique.mockResolvedValueOnce({
        ...mockUser({ id: newUserId, email: "new-user@example.com" }),
        UserRole: [
          {
            ...mockUserRole({ user_id: newUserId, role_id: "role-admin" }),
            Role: mockRole({ id: "role-admin", name: "Admin" }),
          },
        ],
        Clinician: null,
        clinicalInfos: [],
      } as MockUser);

      // Create request
      const newUser = {
        email: "new-user@example.com",
        firstName: "New",
        lastName: "User",
        password: "password123",
        roles: ["Admin"], // Changed from roleIds to roles
      };

      const request = createRequestWithBody("/api/team-members", newUser);
      const response = await POST(request);
      const data = await response.json();

      // Assert response
      expect(response.status).toBe(201);
      expect(data).toHaveProperty("id", newUserId);
      expect(data.email).toBe(newUser.email);

      // Verify password was hashed
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: newUser.email,
          password_hash: "hashed_password",
          UserRole: {
            create: [{ role_id: "role-admin" }],
          },
        }),
      });
    });

    it("should create a new clinician team member", async () => {
      // Mock user creation with clinician
      const newUserId = "new-clinician-id";

      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      // Mock role finding
      prismaMock.role.findMany.mockResolvedValueOnce([
        mockRole({
          id: "role-clinician",
          name: "CLINICIAN.BASIC",
          description: null,
        }),
      ]);

      prismaMock.$transaction.mockImplementationOnce(async (callback) => {
        const mockNewUser = mockUser({ id: newUserId });
        prismaMock.user.create.mockResolvedValueOnce(mockNewUser);
        prismaMock.clinician.create.mockResolvedValueOnce(
          mockClinician({ user_id: newUserId }),
        );
        prismaMock.clinicalInfo.create.mockResolvedValueOnce(
          mockClinicalInfo({ user_id: newUserId }),
        );
        return await callback(prismaMock);
      });

      prismaMock.user.findUnique.mockResolvedValueOnce({
        ...mockUser({ id: newUserId, email: "new-clinician@example.com" }),
        UserRole: [
          {
            ...mockUserRole({ user_id: newUserId, role_id: "role-clinician" }),
            Role: mockRole({ id: "role-clinician", name: "CLINICIAN.BASIC" }),
          },
        ],
        Clinician: mockClinician({
          user_id: newUserId,
          first_name: "New",
          last_name: "Clinician",
        }) as MockClinician,
        clinicalInfos: [],
      } as MockUser);

      // Create request
      const newUser = {
        email: "new-clinician@example.com",
        firstName: "New",
        lastName: "Clinician",
        password: "password123",
        roles: ["CLINICIAN.BASIC"], // Changed from roleIds to roles
      };

      const request = createRequestWithBody("/api/team-members", newUser);
      const response = await POST(request);
      const data = await response.json();

      // Assert response
      expect(response.status).toBe(201);
      expect(data).toHaveProperty("id", newUserId);
      expect(data.email).toBe(newUser.email);

      // Verify clinician was created with default values
      expect(prismaMock.clinician.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: newUserId,
          first_name: newUser.firstName,
          last_name: newUser.lastName,
          address: "", // Default empty address
          percentage_split: 100, // Default 100%
        }),
      });
    });

    it("should create a clinician with license, services, and clinical info", async () => {
      // Mock user creation with full clinician data
      const newUserId = "new-full-clinician-id";
      const newClinicianId = "new-clinician-id";

      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      // Mock role finding
      prismaMock.role.findMany.mockResolvedValueOnce([
        mockRole({
          id: "role-clinician",
          name: "CLINICIAN.FULL",
        }),
      ]);

      prismaMock.$transaction.mockImplementationOnce(async (callback) => {
        const mockNewUser = mockUser({ id: newUserId });
        prismaMock.user.create.mockResolvedValueOnce(mockNewUser);
        prismaMock.clinician.create.mockResolvedValueOnce(
          mockClinician({ id: newClinicianId, user_id: newUserId }),
        );
        prismaMock.clinicalInfo.create.mockResolvedValueOnce(
          mockClinicalInfo({ user_id: newUserId }),
        );
        prismaMock.license.create.mockResolvedValueOnce(
          mockLicense({ clinician_id: newClinicianId }),
        );
        prismaMock.practiceService.findMany.mockResolvedValueOnce([
          mockPracticeService({ id: "service-1" }),
          mockPracticeService({ id: "service-2" }),
        ]);
        prismaMock.clinicianServices.createMany.mockResolvedValueOnce({
          count: 2,
        });
        return await callback(prismaMock);
      });

      prismaMock.user.findUnique.mockResolvedValueOnce({
        ...mockUser({ id: newUserId, email: "dr.new@example.com" }),
        UserRole: [
          {
            ...mockUserRole({ user_id: newUserId, role_id: "role-clinician" }),
            Role: mockRole({ id: "role-clinician", name: "CLINICIAN.FULL" }),
          },
        ],
        Clinician: mockClinician({
          id: newClinicianId,
          user_id: newUserId,
          first_name: "Dr",
          last_name: "New",
          ClinicianServices: [
            {
              ...mockClinicianService(),
              PracticeService: mockPracticeService({ id: "service-1" }),
            },
            {
              ...mockClinicianService(),
              PracticeService: mockPracticeService({ id: "service-2" }),
            },
          ],
          License: [mockLicense()],
        }) as MockClinician,
        clinicalInfos: [mockClinicalInfo({ user_id: newUserId })],
      } as MockUser);

      // Create request
      const newUser = {
        email: "dr.new@example.com",
        firstName: "Dr",
        lastName: "New",
        password: "password123",
        roles: ["CLINICIAN.FULL"],
        specialty: "Psychiatry",
        npiNumber: "1234567890",
        license: {
          type: "Medical",
          number: "MD789",
          expirationDate: "2025-12-31",
          state: "NY",
        },
        services: ["service-1", "service-2"],
      };

      const request = createRequestWithBody("/api/team-members", newUser);
      const response = await POST(request);
      const data = await response.json();

      // Assert response
      expect(response.status).toBe(201);
      expect(data).toHaveProperty("id", newUserId);
      expect(data.email).toBe(newUser.email);

      // Verify clinical info was created
      expect(prismaMock.clinicalInfo.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: newUserId,
          speciality: "Psychiatry",
          NPI_number: 1234567890,
        }),
      });

      // Verify license was created
      expect(prismaMock.license.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          clinician_id: newClinicianId,
          license_type: "Medical",
          license_number: "MD789",
        }),
      });

      // Verify services were assigned
      expect(prismaMock.clinicianServices.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            clinician_id: newClinicianId,
            service_id: "service-1",
            is_active: true,
          }),
          expect.objectContaining({
            clinician_id: newClinicianId,
            service_id: "service-2",
            is_active: true,
          }),
        ]),
      });
    });

    it("should return 409 if user already exists", async () => {
      // Mock existing user
      prismaMock.user.findUnique.mockResolvedValueOnce(mockUser());

      // Mock role finding (even though it won't be used due to existing user)
      prismaMock.role.findMany.mockResolvedValueOnce([
        mockRole({ id: "role-admin", name: "Admin", description: null }),
      ]);

      // Create request
      const newUser = {
        email: "existing@example.com",
        firstName: "Existing",
        lastName: "User",
        password: "password123",
        roles: ["Admin"], // Changed from roleIds to roles
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

    it("should return 422 for invalid input", async () => {
      // Create request with invalid data
      const invalidUser = {
        email: "invalid-email", // Invalid email format
        firstName: "", // Empty first name
        lastName: "User",
        roles: ["Admin"], // Changed from roleIds to roles
      };

      const request = createRequestWithBody("/api/team-members", invalidUser);
      const response = await POST(request);

      expect(response.status).toBe(422);
      const data = await response.json();
      expect(data).toHaveProperty("error", "Invalid input");
      expect(data).toHaveProperty("details");
    });
  });

  describe("PUT /api/team-members", () => {
    it("should update a user's email", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174000";

      // Mock existing user
      prismaMock.user.findUnique.mockResolvedValueOnce({
        ...mockUser({ id: userId, email: "old-email@example.com" }),
        UserRole: [],
        Clinician: null,
      } as MockUser);

      // Mock email check
      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      // Mock transaction
      prismaMock.$transaction.mockImplementationOnce(async (callback) => {
        prismaMock.user.update.mockResolvedValueOnce(
          mockUser({ id: userId, email: "new-email@example.com" }),
        );
        return await callback(prismaMock);
      });

      // Mock updated user fetch
      prismaMock.user.findUnique.mockResolvedValueOnce({
        ...mockUser({ id: userId, email: "new-email@example.com" }),
        UserRole: [
          {
            ...mockUserRole({ user_id: userId, role_id: "role-admin" }),
            Role: mockRole({ id: "role-admin", name: "Admin" }),
          },
        ],
        Clinician: null,
      } as MockUser);

      // Create request
      const updateData = {
        id: userId,
        email: "new-email@example.com",
      };

      const request = createRequestWithBody("/api/team-members", updateData, {
        method: "PUT",
      });
      const response = await PUT(request);
      const data = await response.json();

      // Assert response
      expect(response.status).toBe(200);
      expect(data).toHaveProperty("id", userId);
      expect(data.email).toBe("new-email@example.com");

      // Verify user was updated
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { email: "new-email@example.com" },
      });
    });

    it("should update clinician with services, license, and clinical info", async () => {
      const userId = "223e4567-e89b-12d3-a456-426614174001";
      const clinicianId = "323e4567-e89b-12d3-a456-426614174002";
      const licenseId = "423e4567-e89b-12d3-a456-426614174003";

      // Mock existing user with full data
      prismaMock.user.findUnique.mockResolvedValueOnce({
        ...mockUser({ id: userId, email: "dr.update@example.com" }),
        UserRole: [
          {
            ...mockUserRole({ user_id: userId, role_id: "role-clinician" }),
            Role: mockRole({ id: "role-clinician", name: "CLINICIAN.BASIC" }),
          },
        ],
        Clinician: mockClinician({
          id: clinicianId,
          user_id: userId,
          License: [mockLicense({ id: licenseId, license_number: "OLD123" })],
          ClinicianServices: [
            mockClinicianService({ service_id: "old-service" }),
          ],
        }) as MockClinician,
        clinicalInfos: [
          mockClinicalInfo({
            id: "clinical-info-id",
            speciality: "General",
            NPI_number: 9999999999,
          }),
        ],
      } as MockUser);

      // Mock role finding
      prismaMock.role.findMany.mockResolvedValueOnce([
        mockRole({ id: "role-clinician-full", name: "CLINICIAN.FULL" }),
      ]);

      // Mock transaction
      prismaMock.$transaction.mockImplementationOnce(async (callback) => {
        prismaMock.userRole.deleteMany.mockResolvedValueOnce({ count: 1 });
        prismaMock.userRole.createMany.mockResolvedValueOnce({ count: 1 });
        prismaMock.clinician.update.mockResolvedValueOnce(
          mockClinician({ id: clinicianId }),
        );
        prismaMock.clinicalInfo.update.mockResolvedValueOnce(
          mockClinicalInfo({ speciality: "Psychiatry" }),
        );
        // Mock the license.findFirst call that happens in the route
        prismaMock.license.findFirst.mockResolvedValueOnce(
          mockLicense({ id: licenseId, license_number: "OLD123" }),
        );
        prismaMock.license.update.mockResolvedValueOnce(
          mockLicense({ license_number: "NEW456" }),
        );
        prismaMock.clinicianServices.deleteMany.mockResolvedValueOnce({
          count: 1,
        });
        prismaMock.practiceService.findMany.mockResolvedValueOnce([
          mockPracticeService({ id: "new-service-1" }),
          mockPracticeService({ id: "new-service-2" }),
        ]);
        prismaMock.clinicianServices.createMany.mockResolvedValueOnce({
          count: 2,
        });
        return await callback(prismaMock);
      });

      // Mock updated user fetch
      prismaMock.user.findUnique.mockResolvedValueOnce({
        ...mockUser({ id: userId, email: "dr.update@example.com" }),
        UserRole: [
          {
            ...mockUserRole({
              user_id: userId,
              role_id: "role-clinician-full",
            }),
            Role: mockRole({
              id: "role-clinician-full",
              name: "CLINICIAN.FULL",
            }),
          },
        ],
        Clinician: mockClinician({
          id: clinicianId,
          user_id: userId,
          ClinicianServices: [
            {
              ...mockClinicianService(),
              PracticeService: mockPracticeService({ id: "new-service-1" }),
            },
            {
              ...mockClinicianService(),
              PracticeService: mockPracticeService({ id: "new-service-2" }),
            },
          ],
          License: [mockLicense({ license_number: "NEW456" })],
        }) as MockClinician,
        clinicalInfos: [mockClinicalInfo({ speciality: "Psychiatry" })],
      } as MockUser);

      // Create request
      const updateData = {
        id: userId,
        firstName: "Updated",
        lastName: "Doctor",
        roles: ["CLINICIAN.FULL"],
        specialty: "Psychiatry",
        npiNumber: "1111111111",
        license: {
          type: "Medical",
          number: "NEW456",
          expirationDate: "2026-12-31",
          state: "CA",
        },
        services: ["new-service-1", "new-service-2"],
      };

      const request = createRequestWithBody("/api/team-members", updateData, {
        method: "PUT",
      });
      const response = await PUT(request);
      const data = await response.json();

      // Assert response
      expect(response.status).toBe(200);
      expect(data).toHaveProperty("id", userId);

      // Verify clinician was updated
      expect(prismaMock.clinician.update).toHaveBeenCalledWith({
        where: { id: clinicianId },
        data: expect.objectContaining({
          first_name: "Updated",
          last_name: "Doctor",
        }),
      });

      // Verify clinical info was updated
      expect(prismaMock.clinicalInfo.update).toHaveBeenCalledWith({
        where: { id: "clinical-info-id" },
        data: expect.objectContaining({
          speciality: "Psychiatry",
          NPI_number: 1111111111,
        }),
      });

      // Verify license was updated
      expect(prismaMock.license.update).toHaveBeenCalledWith({
        where: { id: licenseId },
        data: expect.objectContaining({
          license_number: "NEW456",
        }),
      });

      // Verify services were replaced
      expect(prismaMock.clinicianServices.deleteMany).toHaveBeenCalledWith({
        where: { clinician_id: clinicianId },
      });
      expect(prismaMock.clinicianServices.createMany).toHaveBeenCalled();
    });

    it("should create clinician record when updating non-clinician to clinician role", async () => {
      const userId = "523e4567-e89b-12d3-a456-426614174004";

      // Mock existing non-clinician user
      prismaMock.user.findUnique.mockResolvedValueOnce({
        ...mockUser({ id: userId }),
        UserRole: [
          {
            ...mockUserRole({ user_id: userId, role_id: "role-admin" }),
            Role: mockRole({ id: "role-admin", name: "Admin" }),
          },
        ],
        Clinician: null,
        clinicalInfos: [],
      } as MockUser);

      // Mock role finding
      prismaMock.role.findMany.mockResolvedValueOnce([
        mockRole({ id: "role-clinician", name: "CLINICIAN.BASIC" }),
      ]);

      // Mock transaction
      prismaMock.$transaction.mockImplementationOnce(async (callback) => {
        prismaMock.userRole.deleteMany.mockResolvedValueOnce({ count: 1 });
        prismaMock.userRole.createMany.mockResolvedValueOnce({ count: 1 });
        prismaMock.clinician.create.mockResolvedValueOnce(
          mockClinician({ user_id: userId }),
        );
        prismaMock.clinicalInfo.create.mockResolvedValueOnce(
          mockClinicalInfo({ user_id: userId }),
        );
        return await callback(prismaMock);
      });

      // Mock updated user fetch
      prismaMock.user.findUnique.mockResolvedValueOnce({
        ...mockUser({ id: userId }),
        UserRole: [
          {
            ...mockUserRole({ user_id: userId, role_id: "role-clinician" }),
            Role: mockRole({ id: "role-clinician", name: "CLINICIAN.BASIC" }),
          },
        ],
        Clinician: mockClinician({ user_id: userId }) as MockClinician,
        clinicalInfos: [],
      } as MockUser);

      // Create request
      const updateData = {
        id: userId,
        roles: ["CLINICIAN.BASIC"],
        firstName: "New",
        lastName: "Clinician",
      };

      const request = createRequestWithBody("/api/team-members", updateData, {
        method: "PUT",
      });
      const response = await PUT(request);

      expect(response.status).toBe(200);

      // Verify clinician was created
      expect(prismaMock.clinician.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: userId,
          first_name: "New",
          last_name: "Clinician",
          address: "",
          percentage_split: 100,
        }),
      });
    });

    it("should return 404 if user to update doesn't exist", async () => {
      // Mock non-existent user
      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      // Create request with valid UUID format
      const updateData = {
        id: "00000000-0000-0000-0000-000000000000",
        email: "new-email@example.com",
      };

      const request = createRequestWithBody("/api/team-members", updateData, {
        method: "PUT",
      });
      const response = await PUT(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toHaveProperty("error", "User not found");
    });

    it("should return 404 for invalid UUID format", async () => {
      // Create request with invalid UUID format
      const updateData = {
        id: "invalid-uuid",
        email: "new-email@example.com",
      };

      const request = createRequestWithBody("/api/team-members", updateData, {
        method: "PUT",
      });
      const response = await PUT(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toHaveProperty("error", "User not found");
    });
  });

  describe("DELETE /api/team-members", () => {
    it("should soft-delete a user", async () => {
      const userId = "623e4567-e89b-12d3-a456-426614174005";

      // Mock existing user
      prismaMock.user.findUnique.mockResolvedValueOnce({
        ...mockUser({ id: userId }),
        Clinician: null,
      } as MockUser);

      // Mock transaction
      prismaMock.$transaction.mockImplementationOnce(async (callback) => {
        prismaMock.user.update.mockResolvedValueOnce(
          mockUser({
            id: userId,
            email: `DELETED-${Date.now()}-test@example.com`,
            password_hash: "DELETED",
          }),
        );
        return await callback(prismaMock);
      });

      // Create request
      const request = createRequest(`/api/team-members?id=${userId}`, {
        method: "DELETE",
      });
      const response = await DELETE(request);
      const data = await response.json();

      // Assert response
      expect(response.status).toBe(200);
      expect(data).toHaveProperty("success", true);

      // Verify user was soft-deleted
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: expect.objectContaining({
          email: expect.stringContaining("DELETED"),
          password_hash: "DELETED",
        }),
      });
    });

    it("should mark associated clinician as inactive when deleting", async () => {
      const userId = "723e4567-e89b-12d3-a456-426614174006";
      const clinicianId = "823e4567-e89b-12d3-a456-426614174007";

      // Mock existing user with clinician
      prismaMock.user.findUnique.mockResolvedValueOnce({
        ...mockUser({ id: userId }),
        Clinician: mockClinician({
          id: clinicianId,
          user_id: userId,
        }) as MockClinician,
      } as MockUser);

      // Mock transaction
      prismaMock.$transaction.mockImplementationOnce(async (callback) => {
        prismaMock.clinician.update.mockResolvedValueOnce(
          mockClinician({
            id: clinicianId,
            user_id: userId,
            is_active: false,
          }) as MockClinician,
        );
        prismaMock.user.update.mockResolvedValueOnce(
          mockUser({
            id: userId,
            email: `DELETED-${Date.now()}-test@example.com`,
            password_hash: "DELETED",
          }),
        );
        return await callback(prismaMock);
      });

      // Create request
      const request = createRequest(`/api/team-members?id=${userId}`, {
        method: "DELETE",
      });
      const response = await DELETE(request);

      // Assert response
      expect(response.status).toBe(200);

      // Verify clinician was marked inactive
      expect(prismaMock.clinician.update).toHaveBeenCalledWith({
        where: { id: clinicianId },
        data: { is_active: false },
      });
    });

    it("should return 400 if no ID is provided", async () => {
      // Create request without ID
      const request = createRequest("/api/team-members", { method: "DELETE" });
      const response = await DELETE(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty("error", "User ID is required");
    });

    it("should return 404 if user to delete doesn't exist", async () => {
      // Mock non-existent user
      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      // Create request with valid UUID format
      const request = createRequest(
        "/api/team-members?id=00000000-0000-0000-0000-000000000000",
        {
          method: "DELETE",
        },
      );
      const response = await DELETE(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toHaveProperty("error", "User not found");
    });

    it("should return 404 for invalid UUID format", async () => {
      // Create request with invalid UUID format
      const request = createRequest("/api/team-members?id=invalid-uuid", {
        method: "DELETE",
      });
      const response = await DELETE(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toHaveProperty("error", "User not found");
    });
  });

  describe("Error handling with withErrorHandling wrapper", () => {
    it("should handle database errors gracefully in GET route", async () => {
      // Mock database error
      prismaMock.user.findMany.mockRejectedValueOnce(
        new Error("Database connection failed"),
      );

      const request = createRequest("/api/team-members");
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();

      // In development, we should get detailed error info
      expect(data).toHaveProperty("error");
      expect(data.error).toHaveProperty("message");
      expect(data.error).toHaveProperty("issueId");
      expect(data.error.issueId).toMatch(/^ERR-\d{8}-\d{6}-[A-Z0-9]{4}$/);
    });

    it("should handle database errors gracefully in POST route", async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);
      prismaMock.role.findMany.mockResolvedValueOnce([
        mockRole({ name: "Admin" }),
      ]);

      // Mock transaction error
      prismaMock.$transaction.mockRejectedValueOnce(
        new Error("Transaction failed"),
      );

      const newUser = {
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        roles: ["Admin"],
      };

      const request = createRequestWithBody("/api/team-members", newUser);
      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toHaveProperty("error");
      expect(data.error).toHaveProperty("issueId");
    });

    it("should handle database errors gracefully in PUT route", async () => {
      const userId = "923e4567-e89b-12d3-a456-426614174008";

      // Mock the initial user check to succeed
      prismaMock.user.findUnique.mockResolvedValueOnce({
        ...mockUser({ id: userId }),
        UserRole: [],
        Clinician: null,
        clinicalInfos: [],
      } as MockUser);

      // Mock transaction error
      prismaMock.$transaction.mockRejectedValueOnce(new Error("Update failed"));

      const updateData = {
        id: userId,
        email: "updated@example.com",
      };

      const request = createRequestWithBody("/api/team-members", updateData, {
        method: "PUT",
      });
      const response = await PUT(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toHaveProperty("error");
      expect(data.error).toHaveProperty("issueId");
    });

    it("should handle database errors gracefully in DELETE route", async () => {
      const userId = "a23e4567-e89b-12d3-a456-426614174009";

      prismaMock.user.findUnique.mockResolvedValueOnce({
        ...mockUser({ id: userId }),
        Clinician: null,
      } as MockUser);

      // Mock transaction error
      prismaMock.$transaction.mockRejectedValueOnce(new Error("Delete failed"));

      const request = createRequest(`/api/team-members?id=${userId}`, {
        method: "DELETE",
      });
      const response = await DELETE(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toHaveProperty("error");
      expect(data.error).toHaveProperty("issueId");
    });
  });
});
