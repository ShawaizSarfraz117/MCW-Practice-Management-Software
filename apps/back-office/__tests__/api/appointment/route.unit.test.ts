import { vi } from "vitest";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextResponse } from "next/server";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { GET, POST, DELETE } from "@/api/appointment/route";
import prismaMock from "@mcw/database/mock";
import {
  ClientGroupFactory,
  createAppointmentWithRelations,
} from "@mcw/database/mock-data";
import { Decimal } from "@prisma/client/runtime/library";

// Mock the utilities
vi.mock("@/utils/appointment-helpers", () => {
  const mockValidateAppointmentData = vi.fn();
  const mockCreateAppointmentWhereClause = vi.fn();
  const mockCheckAppointmentLimit = vi.fn();
  const mockAddDefaultAppointmentTags = vi.fn();

  return {
    validateAppointmentData: mockValidateAppointmentData,
    createAppointmentWhereClause: mockCreateAppointmentWhereClause,
    checkAppointmentLimit: mockCheckAppointmentLimit,
    parseRecurringRule: vi.fn((rule) => ({
      freq: rule.includes("Weekly") ? "WEEKLY" : rule,
      byDays: rule.includes("Monday") ? ["Monday", "Wednesday", "Friday"] : [],
    })),
    adjustDateForRecurringPattern: vi.fn((start, end) => ({
      adjustedStartDate: start,
      adjustedEndDate: end,
    })),
    getAppointmentIncludes: vi.fn(() => ({
      Clinician: { include: { User: true } },
      Location: true,
      ClientGroup: {
        include: { ClientGroupMembership: { include: { Client: true } } },
      },
      AppointmentTag: { include: { Tag: true } },
    })),
    addDefaultAppointmentTags: mockAddDefaultAppointmentTags,
  };
});

vi.mock("@/utils/appointment-recurring", () => {
  const mockCreateWeeklyRecurringWithDays = vi.fn();
  const mockCreateStandardRecurring = vi.fn();

  return {
    createWeeklyRecurringWithDays: mockCreateWeeklyRecurringWithDays,
    createStandardRecurring: mockCreateStandardRecurring,
  };
});

vi.mock("@/utils/appointment-handlers", () => {
  const mockHandleUpdateThisOnly = vi.fn();
  const mockHandleUpdateFuture = vi.fn();
  const mockHandleDeleteSingle = vi.fn();
  const mockHandleDeleteAll = vi.fn();
  const mockHandleDeleteFuture = vi.fn();

  return {
    handleUpdateThisOnly: mockHandleUpdateThisOnly,
    handleUpdateFuture: mockHandleUpdateFuture,
    handleDeleteSingle: mockHandleDeleteSingle,
    handleDeleteAll: mockHandleDeleteAll,
    handleDeleteFuture: mockHandleDeleteFuture,
  };
});

// Import mocked functions
import {
  validateAppointmentData,
  createAppointmentWhereClause,
  checkAppointmentLimit,
  addDefaultAppointmentTags,
} from "@/utils/appointment-helpers";
import { createStandardRecurring } from "@/utils/appointment-recurring";
import {
  handleDeleteSingle,
  handleDeleteAll,
  handleDeleteFuture,
} from "@/utils/appointment-handlers";

// Get mock references
const mockValidateAppointmentData = vi.mocked(validateAppointmentData);
const mockCreateAppointmentWhereClause = vi.mocked(
  createAppointmentWhereClause,
);
const mockCheckAppointmentLimit = vi.mocked(checkAppointmentLimit);
const mockAddDefaultAppointmentTags = vi.mocked(addDefaultAppointmentTags);
const mockCreateStandardRecurring = vi.mocked(createStandardRecurring);
const mockHandleDeleteSingle = vi.mocked(handleDeleteSingle);
const mockHandleDeleteAll = vi.mocked(handleDeleteAll);
const mockHandleDeleteFuture = vi.mocked(handleDeleteFuture);

describe("Appointment API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set default mock behaviors
    mockValidateAppointmentData.mockReturnValue([]);
    mockCreateAppointmentWhereClause.mockReturnValue({});
    mockCheckAppointmentLimit.mockResolvedValue(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/appointment", () => {
    it("should return a specific appointment when id is provided", async () => {
      const mockAppointment = createAppointmentWithRelations({
        id: "test-id",
        client_group_id: "group-123",
        clinician_id: "clinician-123",
        location_id: "location-123",
        start_date: new Date(),
        end_date: new Date(),
        status: "SCHEDULED",
      });
      prismaMock.appointment.findUnique.mockResolvedValue(mockAppointment);
      prismaMock.appointment.count.mockResolvedValue(1);

      const request = createRequest("/api/appointment?id=test-id");
      const response = await GET(request);
      const data = await response.json();

      expect(prismaMock.appointment.findUnique).toHaveBeenCalledWith({
        where: { id: "test-id" },
        include: expect.objectContaining({
          User: true,
          PracticeService: true,
          Invoice: expect.objectContaining({
            include: {
              Payment: true,
            },
          }),
        }),
      });

      expect(data).toHaveProperty("id", mockAppointment.id);
      expect(data).toHaveProperty("isFirstAppointmentForGroup", true);
    });

    it("should return 404 when appointment is not found", async () => {
      prismaMock.appointment.findUnique.mockResolvedValue(null);

      const request = createRequest("/api/appointment?id=non-existent");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: "Appointment not found" });
    });

    it("should return all appointments when no id is provided", async () => {
      const mockAppointments = [
        createAppointmentWithRelations({ id: "1", client_group_id: null }),
        createAppointmentWithRelations({ id: "2", client_group_id: null }),
      ];
      prismaMock.appointment.findMany.mockResolvedValue(mockAppointments);
      prismaMock.appointment.groupBy = vi.fn().mockResolvedValue([]);

      const request = createRequest("/api/appointment");
      const response = await GET(request);
      const data = await response.json();

      expect(prismaMock.appointment.findMany).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Object),
        orderBy: {
          start_date: "asc",
        },
      });

      expect(data).toHaveLength(2);
      expect(data[0]).toHaveProperty("isFirstAppointmentForGroup", false);
    });

    it("should filter appointments by clinician", async () => {
      const clinicianId = "clinician-123";
      prismaMock.appointment.findMany.mockResolvedValue([]);
      prismaMock.appointment.groupBy = vi.fn().mockResolvedValue([]);
      mockCreateAppointmentWhereClause.mockReturnValue({
        clinician_id: clinicianId,
      });

      const request = createRequest(
        `/api/appointment?clinicianId=${clinicianId}`,
      );
      await GET(request);

      expect(prismaMock.appointment.findMany).toHaveBeenCalledWith({
        where: {
          clinician_id: clinicianId,
        },
        include: expect.any(Object),
        orderBy: {
          start_date: "asc",
        },
      });
    });

    it("should filter appointments by date range", async () => {
      const startDate = "2024-01-01";
      const endDate = "2024-01-31";
      prismaMock.appointment.findMany.mockResolvedValue([]);
      prismaMock.appointment.groupBy = vi.fn().mockResolvedValue([]);
      mockCreateAppointmentWhereClause.mockReturnValue({
        start_date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      });

      const request = createRequest(
        `/api/appointment?startDate=${startDate}&endDate=${endDate}`,
      );
      await GET(request);

      expect(prismaMock.appointment.findMany).toHaveBeenCalledWith({
        where: {
          start_date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        include: expect.any(Object),
        orderBy: {
          start_date: "asc",
        },
      });
    });

    it("should correctly identify first appointments for client groups", async () => {
      const clientGroupId = "group-123";
      const mockAppointments = [
        createAppointmentWithRelations({
          id: "1",
          client_group_id: clientGroupId,
        }),
      ];
      prismaMock.appointment.findMany.mockResolvedValue(mockAppointments);
      prismaMock.appointment.groupBy = vi.fn().mockResolvedValue([
        {
          client_group_id: clientGroupId,
          _count: { client_group_id: 1 },
        },
      ]);

      const request = createRequest("/api/appointment");
      const response = await GET(request);
      const data = await response.json();

      expect(data[0].isFirstAppointmentForGroup).toBe(true);
    });
  });

  describe("POST /api/appointment", () => {
    it("should create a new appointment successfully", async () => {
      const clientGroup = {
        ...ClientGroupFactory.build(),
        is_active: true,
        available_credit: new Decimal(0),
        clinician_id: null,
        created_at: null,
        notes: null,
        auto_monthly_statement_enabled: null,
        auto_monthly_superbill_enabled: null,
        first_seen_at: null,
      };
      const newAppointmentData = {
        start_date: "2024-01-15T10:00:00Z",
        end_date: "2024-01-15T11:00:00Z",
        appointment_duration: 60,
        clinician_id: "clinician-123",
        client_group_id: clientGroup.id,
        location_id: "location-123",
        created_by: "user-123",
        appointment_type: "Standard",
      };

      const createdAppointment = createAppointmentWithRelations({
        id: "created-appointment-id",
        ...newAppointmentData,
        start_date: new Date(newAppointmentData.start_date),
        end_date: new Date(newAppointmentData.end_date),
        status: "SCHEDULED",
        type: "appointment",
      });

      prismaMock.clientGroup.findUnique.mockResolvedValue(clientGroup);
      prismaMock.appointment.create.mockResolvedValue(createdAppointment);
      const appointmentWithTags = {
        ...createdAppointment,
        AppointmentTag: [],
      };
      prismaMock.appointment.findUnique.mockResolvedValue(appointmentWithTags);

      const request = createRequestWithBody(
        "/api/appointment",
        newAppointmentData,
      );
      const response = await POST(request);
      const data = await response.json();

      expect(prismaMock.appointment.create).toHaveBeenCalled();
      expect(mockAddDefaultAppointmentTags).toHaveBeenCalledWith(
        createdAppointment.id,
        createdAppointment.client_group_id,
      );

      expect(response.status).toBe(201);
      expect(data).toHaveProperty("id", createdAppointment.id);
    });

    it("should return 400 for missing required fields", async () => {
      const invalidData = {
        start_date: "2024-01-15T10:00:00Z",
        // Missing other required fields
      };

      mockValidateAppointmentData.mockReturnValue([
        "appointment duration",
        "clinician",
        "location",
        "created by or clinician",
        "client",
      ]);

      const request = createRequestWithBody("/api/appointment", invalidData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing required fields");
      expect(data.missingFields).toBeDefined();
      expect(data.missingFields).toContain("appointment duration");
    });

    it("should return 400 for invalid client group", async () => {
      const appointmentData = {
        start_date: "2024-01-15T10:00:00Z",
        end_date: "2024-01-15T11:00:00Z",
        appointment_duration: 60,
        clinician_id: "clinician-123",
        client_group_id: "invalid-group-id",
        location_id: "location-123",
        created_by: "user-123",
        appointment_type: "Standard",
      };

      prismaMock.clientGroup.findUnique.mockResolvedValue(null);

      const request = createRequestWithBody(
        "/api/appointment",
        appointmentData,
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid client group");
      expect(data.details).toContain("invalid-group-id");
    });

    it("should return 400 when appointment limit is reached", async () => {
      const appointmentData = {
        start_date: "2024-01-15T10:00:00Z",
        end_date: "2024-01-15T11:00:00Z",
        appointment_duration: 60,
        clinician_id: "clinician-123",
        client_group_id: "group-123",
        location_id: "location-123",
        created_by: "user-123",
        appointment_type: "Standard",
      };

      const clientGroup = {
        ...ClientGroupFactory.build(),
        is_active: true,
        available_credit: new Decimal(0),
        clinician_id: null,
        created_at: null,
        notes: null,
        auto_monthly_statement_enabled: null,
        auto_monthly_superbill_enabled: null,
        first_seen_at: null,
      };
      prismaMock.clientGroup.findUnique.mockResolvedValue(clientGroup);
      mockCheckAppointmentLimit.mockResolvedValue(true);

      const request = createRequestWithBody(
        "/api/appointment",
        appointmentData,
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Appointment limit reached for this day.");
    });

    it("should create recurring appointments when recurring rule is provided", async () => {
      const clientGroup = {
        ...ClientGroupFactory.build(),
        is_active: true,
        available_credit: new Decimal(0),
        clinician_id: null,
        created_at: null,
        notes: null,
        auto_monthly_statement_enabled: null,
        auto_monthly_superbill_enabled: null,
        first_seen_at: null,
      };
      const appointmentData = {
        start_date: "2024-01-15T10:00:00Z",
        end_date: "2024-01-15T11:00:00Z",
        appointment_duration: 60,
        clinician_id: "clinician-123",
        client_group_id: clientGroup.id,
        location_id: "location-123",
        created_by: "user-123",
        appointment_type: "Standard",
        is_recurring: true,
        recurring_rule: "Weekly",
        recurring_end_date: "2024-02-15",
      };

      const masterAppointment = createAppointmentWithRelations({
        id: "master-1",
        ...appointmentData,
        type: "appointment",
        start_date: new Date(appointmentData.start_date),
        end_date: new Date(appointmentData.end_date),
      });

      const createdAppointments = [
        createAppointmentWithRelations({
          id: "1",
          ...appointmentData,
          start_date: new Date(appointmentData.start_date),
          end_date: new Date(appointmentData.end_date),
        }),
        createAppointmentWithRelations({
          id: "2",
          ...appointmentData,
          start_date: new Date(appointmentData.start_date),
          end_date: new Date(appointmentData.end_date),
        }),
      ];

      prismaMock.clientGroup.findUnique.mockResolvedValue(clientGroup);
      prismaMock.appointment.create.mockResolvedValue(masterAppointment);
      mockCreateStandardRecurring.mockResolvedValue(createdAppointments);
      prismaMock.appointment.findMany.mockResolvedValue(createdAppointments);

      const request = createRequestWithBody(
        "/api/appointment",
        appointmentData,
      );
      const response = await POST(request);
      const data = await response.json();

      expect(prismaMock.appointment.create).toHaveBeenCalled();
      expect(mockAddDefaultAppointmentTags).toHaveBeenCalled();
      expect(mockCreateStandardRecurring).toHaveBeenCalled();

      expect(response.status).toBe(201);
      expect(data).toHaveLength(2);
    });

    it("should return 400 for invalid date format", async () => {
      const appointmentData = {
        start_date: "invalid-date",
        end_date: "2024-01-15T11:00:00Z",
        appointment_duration: 60,
        clinician_id: "clinician-123",
        location_id: "location-123",
        created_by: "user-123",
        appointment_type: "Standard",
      };

      const request = createRequestWithBody(
        "/api/appointment",
        appointmentData,
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid date format");
    });

    it("should return 400 for invalid request data", async () => {
      const request = createRequestWithBody(
        "/api/appointment",
        null as unknown as Record<string, unknown>,
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid request data");
    });
  });

  describe("DELETE /api/appointment", () => {
    it("should delete a single appointment", async () => {
      const existingAppointment = createAppointmentWithRelations({
        id: "appointment-123",
        is_recurring: false,
      });

      prismaMock.appointment.findUnique.mockResolvedValue(existingAppointment);
      prismaMock.invoice.findMany.mockResolvedValue([]);
      mockHandleDeleteSingle.mockResolvedValue(
        NextResponse.json({ message: "Appointment deleted successfully" }),
      );

      const request = createRequest(
        "/api/appointment?id=appointment-123&deleteOption=single",
      );
      const response = await DELETE(request);
      const data = await response.json();

      expect(mockHandleDeleteSingle).toHaveBeenCalledWith(
        "appointment-123",
        existingAppointment,
      );

      expect(response.status).toBe(200);
      expect(data.message).toBe("Appointment deleted successfully");
    });

    it("should delete all recurring appointments", async () => {
      const existingAppointment = createAppointmentWithRelations({
        id: "appointment-123",
        is_recurring: true,
        recurring_appointment_id: null,
      });

      prismaMock.appointment.findUnique.mockResolvedValue(existingAppointment);
      prismaMock.invoice.findMany.mockResolvedValue([]);
      mockHandleDeleteAll.mockResolvedValue(
        NextResponse.json({
          message: "All recurring appointments deleted successfully",
          deletedCount: 5,
        }),
      );

      const request = createRequest(
        "/api/appointment?id=appointment-123&deleteOption=all",
      );
      const response = await DELETE(request);
      const data = await response.json();

      expect(mockHandleDeleteAll).toHaveBeenCalledWith("appointment-123");

      expect(response.status).toBe(200);
      expect(data.message).toBe(
        "All recurring appointments deleted successfully",
      );
      expect(data.deletedCount).toBe(5);
    });

    it("should delete future recurring appointments", async () => {
      const existingAppointment = createAppointmentWithRelations({
        id: "appointment-123",
        is_recurring: true,
        recurring_appointment_id: "master-123",
        start_date: new Date("2024-01-15T10:00:00Z"),
      });

      prismaMock.appointment.findUnique.mockResolvedValue(existingAppointment);
      prismaMock.invoice.findMany.mockResolvedValue([]);
      mockHandleDeleteFuture.mockResolvedValue(
        NextResponse.json({
          message: "Future appointments deleted successfully",
          deletedCount: 3,
        }),
      );

      const request = createRequest(
        "/api/appointment?id=appointment-123&deleteOption=future",
      );
      const response = await DELETE(request);
      const data = await response.json();

      expect(mockHandleDeleteFuture).toHaveBeenCalledWith(
        "appointment-123",
        "master-123",
        false,
        new Date("2024-01-15T10:00:00Z"),
        existingAppointment,
      );

      expect(response.status).toBe(200);
      expect(data.message).toBe("Future appointments deleted successfully");
      expect(data.deletedCount).toBe(3);
    });

    it("should return 400 when ID is missing", async () => {
      const request = createRequest("/api/appointment");
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Appointment ID is required");
    });

    it("should return 404 for non-existent appointment", async () => {
      prismaMock.appointment.findUnique.mockResolvedValue(null);

      const request = createRequest(
        "/api/appointment?id=appointment-123&deleteOption=invalid",
      );
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Appointment not found");
    });
  });
});
