/* eslint-disable max-lines-per-function */
import { beforeEach, describe, expect, it, vi, Mock } from "vitest";
import { GET } from "@/api/requests/route";
import {
  AppointmentRequestsFactory,
  RequestContactItemsFactory,
  ClientFactory,
  PracticeServiceFactory,
} from "@mcw/database/mock-data";
import { createRequest } from "@mcw/utils";
// Mock the logger
vi.mock("@mcw/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
  __esModule: true,
}));

// Mock the helpers module
vi.mock("@/utils/helpers", () => ({
  getClinicianInfo: vi.fn(),
  __esModule: true,
}));

// Mock the database operations
vi.mock("@mcw/database", () => {
  const appointmentRequestsFindManyMock = vi.fn();
  const clientFindManyMock = vi.fn();

  return {
    prisma: {
      appointmentRequests: {
        findMany: appointmentRequestsFindManyMock,
      },
      client: {
        findMany: clientFindManyMock,
      },
    },
    __esModule: true,
  };
});

// Import mocked modules
import { prisma } from "@mcw/database";
import { getClinicianInfo } from "@/utils/helpers";

// Type definitions for test data
interface MockAppointmentRequest {
  id: string;
  client_id: string | null;
  clinician_id: string;
  service_id: string;
  start_time: Date;
  end_time: Date;
  status: string;
  received_date: Date;
  PracticeService: {
    id: string;
    description: string;
    duration: number;
  };
  RequestContactItems: Array<{
    id: string;
    first_name: string;
    last_name: string;
    date_of_birth: Date | null;
    type: string;
  }>;
}

interface MockClient {
  id: string;
  legal_first_name: string;
  legal_last_name: string;
  date_of_birth: Date | null;
  is_active: boolean;
  is_waitlist: boolean;
}

describe("Requests API Unit Tests", () => {
  const MOCK_CLINICIAN_ID = "test-clinician-id";

  beforeEach(() => {
    vi.resetAllMocks();

    // Setup default mock for getClinicianInfo
    (getClinicianInfo as ReturnType<typeof vi.fn>).mockResolvedValue({
      isClinician: true,
      clinicianId: MOCK_CLINICIAN_ID,
    });
  });

  describe("GET /api/requests", () => {
    it("should return appointment requests successfully", async () => {
      // Arrange
      const mockService = PracticeServiceFactory.build({
        id: "service-1",
        description: "Individual Therapy",
        duration: 60,
      });

      const mockClient = ClientFactory.build({
        id: "client-1",
        legal_first_name: "John",
        legal_last_name: "Doe",
        date_of_birth: new Date("1990-01-01"),
        is_active: true,
        is_waitlist: false,
      });

      const mockRequest = AppointmentRequestsFactory.build({
        id: "request-1",
        client_id: "client-1",
        clinician_id: MOCK_CLINICIAN_ID,
        service_id: "service-1",
        status: "pending",
        start_time: new Date("2024-01-15T10:00:00Z"),
        end_time: new Date("2024-01-15T11:00:00Z"),
        received_date: new Date("2024-01-10T09:00:00Z"),
      });

      const mockAppointmentRequestWithIncludes: MockAppointmentRequest = {
        ...mockRequest,
        PracticeService: {
          id: mockService.id,
          description: mockService.description!,
          duration: mockService.duration,
        },
        RequestContactItems: [],
      };

      (prisma.appointmentRequests.findMany as Mock).mockResolvedValueOnce([
        mockAppointmentRequestWithIncludes,
      ]);

      (prisma.client.findMany as Mock).mockResolvedValueOnce([mockClient]);

      // Act
      const req = createRequest("/api/requests");
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(200);
      const json = await response.json();

      expect(Array.isArray(json)).toBe(true);
      expect(json).toHaveLength(1);

      const request = json[0];
      expect(request).toHaveProperty("id", "request-1");
      expect(request).toHaveProperty("client");
      expect(request.client).toHaveProperty("name", "John Doe");
      expect(request.client).toHaveProperty("type", "Active");
      expect(request.client).toHaveProperty("clientId", "client-1");
      expect(request).toHaveProperty("appointmentDetails");
      expect(request.appointmentDetails).toHaveProperty(
        "serviceName",
        "Individual Therapy",
      );
      expect(request.appointmentDetails).toHaveProperty("duration", 60);
      expect(request).toHaveProperty("status", "pending");
      expect(request).toHaveProperty("isNewClient", false);

      // Verify database calls
      expect(prisma.appointmentRequests.findMany).toHaveBeenCalledWith({
        where: {
          clinician_id: MOCK_CLINICIAN_ID,
          status: "pending",
        },
        include: {
          PracticeService: {
            select: {
              id: true,
              description: true,
              duration: true,
            },
          },
          RequestContactItems: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              date_of_birth: true,
              type: true,
            },
          },
        },
        orderBy: {
          received_date: "desc",
        },
      });

      expect(prisma.client.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: ["client-1"] },
        },
        select: {
          id: true,
          legal_first_name: true,
          legal_last_name: true,
          date_of_birth: true,
          is_active: true,
          is_waitlist: true,
        },
      });
    });

    it("should handle new client requests without existing client records", async () => {
      // Arrange
      const mockService = PracticeServiceFactory.build({
        id: "service-1",
        description: "Couples Therapy",
        duration: 90,
      });

      const mockContactItem = RequestContactItemsFactory.build({
        id: "contact-1",
        first_name: "Jane",
        last_name: "Smith",
        date_of_birth: new Date("1985-05-15"),
        type: "individual",
      });

      const mockRequest = AppointmentRequestsFactory.build({
        id: "request-1",
        client_id: "client-1",
        clinician_id: MOCK_CLINICIAN_ID,
        service_id: "service-1",
        status: "pending",
        start_time: new Date("2024-01-15T10:00:00Z"),
        end_time: new Date("2024-01-15T11:00:00Z"),
        received_date: new Date("2024-01-10T09:00:00Z"),
      });

      const mockAppointmentRequestWithIncludes: MockAppointmentRequest = {
        ...mockRequest,
        PracticeService: {
          id: mockService.id,
          description: mockService.description!,
          duration: mockService.duration,
        },
        RequestContactItems: [
          {
            id: mockContactItem.id,
            first_name: mockContactItem.first_name,
            last_name: mockContactItem.last_name,
            date_of_birth: mockContactItem.date_of_birth,
            type: mockContactItem.type,
          },
        ],
      };

      (prisma.appointmentRequests.findMany as Mock).mockResolvedValueOnce([
        mockAppointmentRequestWithIncludes,
      ]);

      (prisma.client.findMany as Mock).mockResolvedValueOnce([]); // No existing clients

      // Act
      const req = createRequest("/api/requests");
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(200);
      const json = await response.json();

      expect(Array.isArray(json)).toBe(true);
      expect(json).toHaveLength(1);

      const request = json[0];
      expect(request.client).toHaveProperty("name", "Jane Smith");
      expect(request.client).toHaveProperty("type", "New Client");
      expect(request.client).not.toHaveProperty("clientId");
      expect(request).toHaveProperty("isNewClient", true);
    });

    it("should filter by tab parameter", async () => {
      // Arrange
      (prisma.appointmentRequests.findMany as Mock).mockResolvedValueOnce([]);
      (prisma.client.findMany as Mock).mockResolvedValueOnce([]);

      // Act
      const req = createRequest("/api/requests?tab=archived");
      await GET(req);

      // Assert
      expect(prisma.appointmentRequests.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "archived",
          }),
        }),
      );
    });

    it("should handle client status filtering", async () => {
      // Arrange
      const mockActiveClients: MockClient[] = [
        ClientFactory.build({
          id: "client-1",
          is_active: true,
        }),
      ];

      // Mock the client.findMany calls for filtering
      (prisma.client.findMany as Mock)
        .mockResolvedValueOnce(mockActiveClients) // For filtering
        .mockResolvedValueOnce([]); // For final client lookup

      (prisma.appointmentRequests.findMany as Mock).mockResolvedValueOnce([]);

      // Act
      const req = createRequest("/api/requests?clientStatus=active");
      await GET(req);

      // Assert
      expect(prisma.client.findMany).toHaveBeenCalledWith({
        where: {
          is_active: true,
          ClinicianClient: {
            some: {
              clinician_id: MOCK_CLINICIAN_ID,
            },
          },
        },
        select: { id: true },
      });
    });

    it("should return 401 when clinician is not found", async () => {
      // Arrange
      (getClinicianInfo as ReturnType<typeof vi.fn>).mockResolvedValue({
        isClinician: false,
        clinicianId: null,
      });

      // Act
      const req = createRequest("/api/requests");
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({
        error: "Clinician not found",
      });

      // Verify no database calls were made
      expect(prisma.appointmentRequests.findMany).not.toHaveBeenCalled();
    });

    it("should return 500 when database error occurs", async () => {
      // Arrange
      const mockError = new Error("Database connection failed");
      (prisma.appointmentRequests.findMany as Mock).mockRejectedValue(
        mockError,
      );

      // Act
      const req = createRequest("/api/requests");
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json).toEqual({
        error: "Failed to fetch appointment requests",
      });
    });

    it("should handle empty results correctly", async () => {
      // Arrange
      (prisma.appointmentRequests.findMany as Mock).mockResolvedValueOnce([]);
      (prisma.client.findMany as Mock).mockResolvedValueOnce([]);

      // Act
      const req = createRequest("/api/requests");
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(Array.isArray(json)).toBe(true);
      expect(json).toHaveLength(0);
    });

    it("should calculate client age correctly", async () => {
      // Arrange
      const birthDate = new Date("1990-06-15");
      const currentYear = new Date().getFullYear();
      const expectedAge = currentYear - 1990;

      const mockClient = ClientFactory.build({
        id: "client-1",
        date_of_birth: birthDate,
        is_active: true,
      });

      const mockRequest = AppointmentRequestsFactory.build({
        id: "request-1",
        client_id: "client-1",
        clinician_id: MOCK_CLINICIAN_ID,
      });

      const mockAppointmentRequestWithIncludes: MockAppointmentRequest = {
        ...mockRequest,
        PracticeService: {
          id: "service-1",
          description: "Therapy",
          duration: 60,
        },
        RequestContactItems: [],
      };

      (prisma.appointmentRequests.findMany as Mock).mockResolvedValueOnce([
        mockAppointmentRequestWithIncludes,
      ]);
      (prisma.client.findMany as Mock).mockResolvedValueOnce([mockClient]);

      // Act
      const req = createRequest("/api/requests");
      const response = await GET(req);

      // Assert
      const json = await response.json();
      expect(json[0].client.age).toBe(expectedAge);
    });

    it("should handle client type classification correctly", async () => {
      // Arrange
      const waitlistClient = ClientFactory.build({
        id: "client-1",
        is_active: false,
        is_waitlist: true,
      });

      const prospectiveClient = ClientFactory.build({
        id: "client-2",
        is_active: false,
        is_waitlist: false,
      });

      const activeClient = ClientFactory.build({
        id: "client-3",
        is_active: true,
        is_waitlist: false,
      });

      const mockRequests: MockAppointmentRequest[] = [
        {
          id: "req-1",
          client_id: "client-1",
          clinician_id: MOCK_CLINICIAN_ID,
          service_id: "s1",
          start_time: new Date(),
          end_time: new Date(),
          status: "pending",
          received_date: new Date(),
          PracticeService: { id: "s1", description: "Therapy", duration: 60 },
          RequestContactItems: [],
        },
        {
          id: "req-2",
          client_id: "client-2",
          clinician_id: MOCK_CLINICIAN_ID,
          service_id: "s2",
          start_time: new Date(),
          end_time: new Date(),
          status: "pending",
          received_date: new Date(),
          PracticeService: { id: "s2", description: "Therapy", duration: 60 },
          RequestContactItems: [],
        },
        {
          id: "req-3",
          client_id: "client-3",
          clinician_id: MOCK_CLINICIAN_ID,
          service_id: "s3",
          start_time: new Date(),
          end_time: new Date(),
          status: "pending",
          received_date: new Date(),
          PracticeService: { id: "s3", description: "Therapy", duration: 60 },
          RequestContactItems: [],
        },
      ];

      (prisma.appointmentRequests.findMany as Mock).mockResolvedValueOnce(
        mockRequests,
      );
      (prisma.client.findMany as Mock).mockResolvedValueOnce([
        waitlistClient,
        prospectiveClient,
        activeClient,
      ]);

      // Act
      const req = createRequest("/api/requests");
      const response = await GET(req);

      // Assert
      const json = await response.json();
      expect(json[0].client.type).toBe("Waitlist");
      expect(json[1].client.type).toBe("Prospective");
      expect(json[2].client.type).toBe("Active");
    });
  });
});
