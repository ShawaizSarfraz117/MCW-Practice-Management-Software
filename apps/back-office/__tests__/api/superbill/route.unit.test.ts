/* eslint-disable max-lines-per-function */
import { beforeEach, describe, expect, it, vi, Mock } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";

// Mock external dependencies first before importing anything else
vi.mock("@mcw/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
  __esModule: true,
}));

// Mock getClinicianInfo properly
vi.mock("@/utils/helpers", () => ({
  getClinicianInfo: vi.fn(),
  __esModule: true,
}));

vi.mock("@mcw/database", () => {
  const superbillFindUniqueMock = vi.fn();
  const superbillFindManyMock = vi.fn();
  const superbillCountMock = vi.fn();
  const superbillCreateMock = vi.fn();
  const superbillFindFirstMock = vi.fn();
  const superbillDeleteMock = vi.fn();
  const appointmentFindUniqueMock = vi.fn();
  const appointmentFindManyMock = vi.fn();
  const appointmentUpdateManyMock = vi.fn();

  return {
    prisma: {
      superbill: {
        findUnique: superbillFindUniqueMock,
        findMany: superbillFindManyMock,
        count: superbillCountMock,
        create: superbillCreateMock,
        findFirst: superbillFindFirstMock,
        delete: superbillDeleteMock,
      },
      appointment: {
        findUnique: appointmentFindUniqueMock,
        findMany: appointmentFindManyMock,
        updateMany: appointmentUpdateManyMock,
      },
    },
    Prisma: {
      Decimal: Decimal,
    },
    __esModule: true,
  };
});

// Import after mocks are defined
import { GET, POST, DELETE } from "@/api/superbill/route";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { prisma } from "@mcw/database";
import { getClinicianInfo } from "@/utils/helpers";

// Helper function to create mock superbill data
const mockSuperbill = (overrides = {}) => {
  return {
    id: "superbill-1",
    superbill_number: 1001,
    client_group_id: "group-1",
    provider_name: "Test Provider",
    provider_email: "provider@example.com",
    client_name: "Test Client",
    status: "CREATED",
    created_by: "clinician-1",
    issued_date: new Date("2023-02-01"),
    created_at: new Date("2023-02-01"),
    Appointment: [
      {
        id: "appointment-1",
        client_group_id: "group-1",
        appointment_fee: 150,
        start_date: new Date("2023-01-15T10:00:00Z"),
        end_date: new Date("2023-01-15T11:00:00Z"),
        PracticeService: {
          code: "90837",
          description: "Therapy Session",
          duration: 60,
          bill_in_units: false,
        },
        Location: {
          name: "Test Location",
          address: "123 Test St",
          city: "Test City",
          state: "TS",
          zip: "12345",
        },
      },
    ],
    ...overrides,
  };
};

// Helper function to create mock appointment data
const mockAppointment = (overrides = {}) => {
  return {
    id: "appointment-1",
    client_group_id: "group-1",
    appointment_fee: 150,
    ClientGroup: {
      id: "group-1",
      name: "Test Group",
      ClientGroupMembership: [
        {
          Client: {
            legal_first_name: "Test",
            legal_last_name: "Client",
          },
        },
      ],
    },
    Clinician: {
      first_name: "Test",
      last_name: "Provider",
      User: {
        email: "provider@example.com",
      },
    },
    PracticeService: {
      code: "90837",
      description: "Therapy Session",
    },
    ...overrides,
  };
};

describe("Superbill API", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Setup mock for getClinicianInfo in each test
    (getClinicianInfo as Mock).mockResolvedValue({
      clinicianId: "clinician-1",
      clinician: {
        id: "clinician-1",
        first_name: "Test",
        last_name: "Provider",
      },
    });
  });

  describe("GET /api/superbill", () => {
    it("should get a superbill by ID", async () => {
      // Arrange
      const superbillId = "superbill-1";
      const mockSuperbillData = mockSuperbill({ id: superbillId });

      (prisma.superbill.findUnique as Mock).mockResolvedValue(
        mockSuperbillData,
      );

      // Act
      const req = createRequest(`/api/superbill?id=${superbillId}`);
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(200);
      const json = await response.json();

      // Individual property checks to avoid date serialization issues
      expect(json.id).toBe(mockSuperbillData.id);
      expect(json.superbill_number).toBe(mockSuperbillData.superbill_number);
      expect(json.client_group_id).toBe(mockSuperbillData.client_group_id);
      expect(json.Appointment).toBeDefined();
      expect(json.Appointment[0].PracticeService.code).toBe(
        mockSuperbillData.Appointment[0].PracticeService.code,
      );
      expect(json.Appointment[0].PracticeService.description).toBe(
        mockSuperbillData.Appointment[0].PracticeService.description,
      );
      expect(json.status).toBe(mockSuperbillData.status);
      expect(json.issued_date).toBe(
        mockSuperbillData.issued_date.toISOString(),
      );
      expect(json.created_at).toBe(mockSuperbillData.created_at.toISOString());

      // Verify correct functions were called
      expect(prisma.superbill.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: superbillId },
          include: {
            Appointment: {
              include: {
                Location: true,
                PracticeService: true,
              },
            },
          },
        }),
      );
    });

    it("should return 404 when superbill ID not found", async () => {
      // Arrange
      const superbillId = "non-existent-id";
      (prisma.superbill.findUnique as Mock).mockResolvedValue(null);

      // Act
      const req = createRequest(`/api/superbill?id=${superbillId}`);
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json).toHaveProperty("error", "Superbill not found");
    });

    it("should get superbills for a client group", async () => {
      // Arrange
      const clientGroupId = "group-1";
      const mockSuperbills = [
        mockSuperbill({ client_group_id: clientGroupId, id: "superbill-1" }),
        mockSuperbill({ client_group_id: clientGroupId, id: "superbill-2" }),
      ];

      (prisma.superbill.findMany as Mock).mockResolvedValue(mockSuperbills);

      // Act
      const req = createRequest(
        `/api/superbill?clientGroupId=${clientGroupId}`,
      );
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(200);
      const json = await response.json();

      expect(Array.isArray(json)).toBe(true);
      expect(json).toHaveLength(2);
      expect(json[0].client_group_id).toBe(clientGroupId);
      expect(json[1].client_group_id).toBe(clientGroupId);

      // Check date serialization for the first item
      expect(json[0].issued_date).toBe(
        mockSuperbills[0].issued_date.toISOString(),
      );
      expect(json[0].created_at).toBe(
        mockSuperbills[0].created_at.toISOString(),
      );

      // Verify correct functions were called
      expect(prisma.superbill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { client_group_id: clientGroupId },
          orderBy: { created_at: "desc" },
          include: {
            Appointment: {
              include: {
                Location: true,
                PracticeService: true,
              },
            },
          },
        }),
      );
    });

    it("should get all superbills with pagination", async () => {
      // Arrange
      const mockSuperbills = [
        mockSuperbill({ id: "superbill-1" }),
        mockSuperbill({ id: "superbill-2" }),
      ];

      (prisma.superbill.findMany as Mock).mockResolvedValue(mockSuperbills);
      (prisma.superbill.count as Mock).mockResolvedValue(2);

      // Act
      const req = createRequest(`/api/superbill?page=1&limit=10`);
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(200);
      const json = await response.json();

      expect(json).toHaveProperty("data");
      expect(json).toHaveProperty("pagination");
      expect(json.data).toHaveLength(2);
      expect(json.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      });

      // Check date serialization for the first item
      expect(json.data[0].issued_date).toBe(
        mockSuperbills[0].issued_date.toISOString(),
      );
      expect(json.data[0].created_at).toBe(
        mockSuperbills[0].created_at.toISOString(),
      );

      // Verify correct functions were called
      expect(prisma.superbill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { created_at: "desc" },
          skip: 0,
          take: 10,
          include: {
            ClientGroup: true,
            Appointment: {
              include: {
                Location: true,
                PracticeService: true,
              },
            },
          },
        }),
      );
      expect(prisma.superbill.count).toHaveBeenCalled();
    });

    it("should handle custom pagination parameters", async () => {
      // Arrange
      const page = 2;
      const limit = 5;
      const mockSuperbills = [
        mockSuperbill({ id: "superbill-3" }),
        mockSuperbill({ id: "superbill-4" }),
      ];

      (prisma.superbill.findMany as Mock).mockResolvedValue(mockSuperbills);
      (prisma.superbill.count as Mock).mockResolvedValue(12);

      // Act
      const req = createRequest(`/api/superbill?page=${page}&limit=${limit}`);
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(200);
      const json = await response.json();

      expect(json.pagination).toEqual({
        page: 2,
        limit: 5,
        total: 12,
        totalPages: 3,
      });

      // Verify the skip parameter is set correctly
      expect(prisma.superbill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5, // (page - 1) * limit = (2 - 1) * 5 = 5
          take: 5,
        }),
      );

      // Check date serialization for the first item
      expect(json.data[0].issued_date).toBe(
        mockSuperbills[0].issued_date.toISOString(),
      );
      expect(json.data[0].created_at).toBe(
        mockSuperbills[0].created_at.toISOString(),
      );
    });

    it("should handle errors gracefully", async () => {
      // Arrange
      (prisma.superbill.findMany as Mock).mockRejectedValue(
        new Error("Database error"),
      );

      // Act
      const req = createRequest(`/api/superbill`);
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json).toHaveProperty("error", "Failed to fetch superbills");
      expect(json).toHaveProperty("message", "Database error");
    });
  });

  describe("POST /api/superbill", () => {
    it("should create a new superbill successfully with a single appointment", async () => {
      // Arrange
      const requestData = {
        appointment_ids: ["appointment-1"],
      };

      const mockAppointmentData = mockAppointment();
      const createdSuperbill = mockSuperbill();

      // Mock appointment findUnique to return the appointment data
      (prisma.appointment.findUnique as Mock).mockResolvedValue(
        mockAppointmentData,
      );

      // Mock appointment findMany to verify all appointments exist
      (prisma.appointment.findMany as Mock).mockResolvedValue([
        { id: "appointment-1", client_group_id: "group-1" },
      ]);

      // Mock superbill findFirst for getting max superbill number
      (prisma.superbill.findFirst as Mock).mockResolvedValue({
        superbill_number: 1000,
      });

      // Mock superbill create
      (prisma.superbill.create as Mock).mockResolvedValue(createdSuperbill);

      // Act
      const req = createRequestWithBody(`/api/superbill`, requestData);
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(201);
      const json = await response.json();

      // Individual property checks to avoid date serialization issues
      expect(json.id).toBe(createdSuperbill.id);
      expect(json.superbill_number).toBe(createdSuperbill.superbill_number);
      expect(json.client_group_id).toBe(createdSuperbill.client_group_id);
      expect(json.Appointment).toBeDefined();
      expect(json.Appointment[0].PracticeService.code).toBe(
        createdSuperbill.Appointment[0].PracticeService.code,
      );
      expect(json.Appointment[0].PracticeService.description).toBe(
        createdSuperbill.Appointment[0].PracticeService.description,
      );
      expect(json.status).toBe(createdSuperbill.status);
      expect(json.issued_date).toBe(createdSuperbill.issued_date.toISOString());
      expect(json.created_at).toBe(createdSuperbill.created_at.toISOString());

      // Verify superbill create was called with correct data
      expect(prisma.superbill.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            superbill_number: expect.any(Number),
            Appointment: {
              connect: [{ id: "appointment-1" }],
            },
          }),
        }),
      );
    });

    it("should create a new superbill successfully with multiple appointments", async () => {
      // Arrange
      const requestData = {
        appointment_ids: ["appointment-1", "appointment-2", "appointment-3"],
      };

      const mockAppointmentData = mockAppointment();
      const createdSuperbill = {
        ...mockSuperbill(),
        Appointment: [
          {
            id: "appointment-1",
            client_group_id: "group-1",
            appointment_fee: 150,
            start_date: new Date("2023-01-15T10:00:00Z"),
            end_date: new Date("2023-01-15T11:00:00Z"),
            PracticeService: {
              code: "90837",
              description: "Therapy Session",
              duration: 60,
              bill_in_units: false,
            },
            Location: {
              name: "Test Location",
              address: "123 Test St",
              city: "Test City",
              state: "TS",
              zip: "12345",
            },
          },
          {
            id: "appointment-2",
            client_group_id: "group-1",
            appointment_fee: 150,
            start_date: new Date("2023-01-16T10:00:00Z"),
            end_date: new Date("2023-01-16T11:00:00Z"),
            PracticeService: {
              code: "90837",
              description: "Therapy Session",
              duration: 60,
              bill_in_units: false,
            },
            Location: {
              name: "Test Location",
              address: "123 Test St",
              city: "Test City",
              state: "TS",
              zip: "12345",
            },
          },
          {
            id: "appointment-3",
            client_group_id: "group-1",
            appointment_fee: 150,
            start_date: new Date("2023-01-17T10:00:00Z"),
            end_date: new Date("2023-01-17T11:00:00Z"),
            PracticeService: {
              code: "90837",
              description: "Therapy Session",
              duration: 60,
              bill_in_units: false,
            },
            Location: {
              name: "Test Location",
              address: "123 Test St",
              city: "Test City",
              state: "TS",
              zip: "12345",
            },
          },
        ],
      };

      // Mock appointment findUnique to return the appointment data
      (prisma.appointment.findUnique as Mock).mockResolvedValue(
        mockAppointmentData,
      );

      // Mock appointment findMany to verify all appointments exist
      (prisma.appointment.findMany as Mock).mockResolvedValue([
        { id: "appointment-1", client_group_id: "group-1" },
        { id: "appointment-2", client_group_id: "group-1" },
        { id: "appointment-3", client_group_id: "group-1" },
      ]);

      // Mock superbill findFirst for getting max superbill number
      (prisma.superbill.findFirst as Mock).mockResolvedValue({
        superbill_number: 1000,
      });

      // Mock superbill create
      (prisma.superbill.create as Mock).mockResolvedValue(createdSuperbill);

      // Act
      const req = createRequestWithBody(`/api/superbill`, requestData);
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(201);
      const json = await response.json();

      // Verify response has multiple appointments
      expect(json.Appointment).toHaveLength(3);

      // Verify appointment IDs match
      const appointmentIds = json.Appointment.map(
        (app: { id: string }) => app.id,
      );
      expect(appointmentIds).toContain("appointment-1");
      expect(appointmentIds).toContain("appointment-2");
      expect(appointmentIds).toContain("appointment-3");

      // Verify superbill create was called with correct data
      expect(prisma.superbill.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            superbill_number: expect.any(Number),
            Appointment: {
              connect: [
                { id: "appointment-1" },
                { id: "appointment-2" },
                { id: "appointment-3" },
              ],
            },
          }),
        }),
      );
    });

    it("should return 400 when required parameters are missing", async () => {
      // Arrange
      const incompleteData = {
        // Missing appointment_ids
      };

      // Act
      const req = createRequestWithBody(`/api/superbill`, incompleteData);
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty(
        "error",
        "Missing required parameter: appointment_ids must be a non-empty array",
      );
    });

    it("should return 400 when appointment_ids is an empty array", async () => {
      // Arrange
      const requestData = {
        appointment_ids: [],
      };

      // Act
      const req = createRequestWithBody(`/api/superbill`, requestData);
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty(
        "error",
        "Missing required parameter: appointment_ids must be a non-empty array",
      );
    });

    it("should return 404 when primary appointment is not found", async () => {
      // Arrange
      const requestData = {
        appointment_ids: ["non-existent-appointment"],
      };

      // Mock appointment findUnique to return null
      (prisma.appointment.findUnique as Mock).mockResolvedValue(null);

      // Act
      const req = createRequestWithBody(`/api/superbill`, requestData);
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json).toHaveProperty("error", "Primary appointment not found");
    });

    it("should return 404 when one or more appointments are not found", async () => {
      // Arrange
      const requestData = {
        appointment_ids: ["appointment-1", "appointment-2", "non-existent"],
      };

      // Mock appointment findUnique to return an appointment
      (prisma.appointment.findUnique as Mock).mockResolvedValue(
        mockAppointment(),
      );

      // Mock appointment findMany to return only 2 of the 3 requested appointments
      (prisma.appointment.findMany as Mock).mockResolvedValue([
        { id: "appointment-1", client_group_id: "group-1" },
        { id: "appointment-2", client_group_id: "group-1" },
      ]);

      // Act
      const req = createRequestWithBody(`/api/superbill`, requestData);
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json).toHaveProperty(
        "error",
        "One or more appointments not found",
      );
    });

    it("should return 400 when appointments belong to different client groups", async () => {
      // Arrange
      const requestData = {
        appointment_ids: ["appointment-1", "appointment-2", "appointment-3"],
      };

      // Mock appointment findUnique to return an appointment
      (prisma.appointment.findUnique as Mock).mockResolvedValue(
        mockAppointment(),
      );

      // Mock appointment findMany to return appointments with different client groups
      (prisma.appointment.findMany as Mock).mockResolvedValue([
        { id: "appointment-1", client_group_id: "group-1" },
        { id: "appointment-2", client_group_id: "group-1" },
        { id: "appointment-3", client_group_id: "group-2" }, // Different client group
      ]);

      // Act
      const req = createRequestWithBody(`/api/superbill`, requestData);
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty(
        "error",
        "All appointments must belong to the same client group",
      );
    });

    it("should return 400 when primary appointment has no client group", async () => {
      // Arrange
      const requestData = {
        appointment_ids: ["appointment-1"],
      };

      // Mock appointment findUnique to return an appointment without client_group_id
      (prisma.appointment.findUnique as Mock).mockResolvedValue({
        ...mockAppointment(),
        client_group_id: null,
      });

      // Act
      const req = createRequestWithBody(`/api/superbill`, requestData);
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty(
        "error",
        "Primary appointment has no associated client group",
      );
    });

    it("should handle errors gracefully", async () => {
      // Arrange
      const requestData = {
        appointment_ids: ["appointment-1"],
      };

      // Mock appointment findUnique to throw an error
      (prisma.appointment.findUnique as Mock).mockRejectedValue(
        new Error("Database error"),
      );

      // Act
      const req = createRequestWithBody(`/api/superbill`, requestData);
      const response = await POST(req);

      // Assert
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json).toHaveProperty("error", "Failed to create superbill");
      expect(json).toHaveProperty("message", "Database error");
    });
  });

  describe("DELETE /api/superbill", () => {
    it("should delete a superbill successfully", async () => {
      // Arrange
      const superbillId = "superbill-1";
      const mockAppointments = [
        { id: "appointment-1" },
        { id: "appointment-2" },
      ];
      const mockSuperbillData = mockSuperbill({
        id: superbillId,
        Appointment: mockAppointments,
      });

      (prisma.superbill.findUnique as Mock).mockResolvedValue(
        mockSuperbillData,
      );
      (prisma.appointment.updateMany as Mock).mockResolvedValue({ count: 2 });
      (prisma.superbill.delete as Mock).mockResolvedValue(mockSuperbillData);

      // Act
      const req = createRequest(`/api/superbill?id=${superbillId}`, {
        method: "DELETE",
      });
      const response = await DELETE(req);

      // Assert
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toHaveProperty("success", true);
      expect(json).toHaveProperty("message", "Superbill deleted successfully");
      expect(json).toHaveProperty("deletedId", superbillId);

      // Verify appointments are updated to remove superbill_id reference
      expect(prisma.appointment.updateMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: ["appointment-1", "appointment-2"],
          },
        },
        data: {
          superbill_id: null,
        },
      });

      // Verify superbill delete was called with correct parameters
      expect(prisma.superbill.delete).toHaveBeenCalledWith({
        where: { id: superbillId },
      });
    });

    it("should return 400 when id parameter is missing", async () => {
      // Arrange - no id parameter

      // Act
      const req = createRequest(`/api/superbill`, { method: "DELETE" });
      const response = await DELETE(req);

      // Assert
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty("error", "Missing required parameter: id");

      // Verify superbill delete was not called
      expect(prisma.superbill.delete).not.toHaveBeenCalled();
    });

    it("should return 404 when superbill is not found", async () => {
      // Arrange
      const superbillId = "non-existent-id";

      // Mock findUnique to return null (superbill not found)
      (prisma.superbill.findUnique as Mock).mockResolvedValue(null);

      // Act
      const req = createRequest(`/api/superbill?id=${superbillId}`, {
        method: "DELETE",
      });
      const response = await DELETE(req);

      // Assert
      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json).toHaveProperty("error", "Superbill not found");

      // Verify superbill delete was not called
      expect(prisma.superbill.delete).not.toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      // Arrange
      const superbillId = "superbill-1";

      // Mock findUnique to return a superbill
      (prisma.superbill.findUnique as Mock).mockResolvedValue(
        mockSuperbill({ id: superbillId }),
      );

      // Mock delete to throw an error
      (prisma.superbill.delete as Mock).mockRejectedValue(
        new Error("Database error"),
      );

      // Act
      const req = createRequest(`/api/superbill?id=${superbillId}`, {
        method: "DELETE",
      });
      const response = await DELETE(req);

      // Assert
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json).toHaveProperty("error", "Failed to delete superbill");
      expect(json).toHaveProperty("message", "Database error");
    });
  });
});
