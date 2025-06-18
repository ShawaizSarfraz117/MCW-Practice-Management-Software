/* eslint-disable max-lines-per-function */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/api/analytics/attendees/route";
import { prisma } from "@mcw/database";
import { getClinicianInfo } from "@/utils/helpers";
import {
  AppointmentFactory,
  ClientGroupFactory,
} from "@mcw/database/mock-data";
import type { ClientGroup } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

// Mock dependencies
vi.mock("@mcw/database", () => ({
  prisma: {
    appointment: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock("@/utils/helpers", () => ({
  getClinicianInfo: vi.fn(),
  getBackOfficeSession: vi.fn().mockResolvedValue({
    user: { id: "user-123", email: "test@example.com" },
  }),
}));

describe("GET /api/analytics/attendees", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockClinicianInfo = {
    clinicianId: "clinician-123",
    isClinician: true,
    clinician: {
      id: "clinician-123",
      first_name: "Dr. John",
      last_name: "Smith",
    },
  };

  const mockClientGroup1: ClientGroup = {
    ...ClientGroupFactory.build({
      id: "group-1",
      name: "John Doe",
      type: "INDIVIDUAL",
    }),
    clinician_id: "clinician-123",
    is_active: true,
    available_credit: new Decimal(0),
    created_at: new Date(),
    auto_monthly_statement_enabled: false,
    auto_monthly_superbill_enabled: false,
    first_seen_at: null,
    notes: null,
  };

  const mockClientGroup2: ClientGroup = {
    ...ClientGroupFactory.build({
      id: "group-2",
      name: "Shawaiz Sarfraz & Mrs Shawaiz",
      type: "COUPLE",
    }),
    clinician_id: "clinician-123",
    is_active: true,
    available_credit: new Decimal(0),
    created_at: new Date(),
    auto_monthly_statement_enabled: false,
    auto_monthly_superbill_enabled: false,
    first_seen_at: null,
    notes: null,
  };

  const mockAppointments = [
    {
      ...AppointmentFactory.build({
        id: "appointment-1",
        start_date: new Date("2025-05-01T10:00:00Z"),
        end_date: new Date("2025-05-01T11:00:00Z"),
        status: "SHOW",
        type: "INDIVIDUAL",
        client_group_id: "group-1",
        clinician_id: "clinician-123",
        title: "Test Appointment 1",
        is_all_day: false,
        location_id: "location-1",
        created_by: "user-1",
      }),
      ClientGroup: {
        ...mockClientGroup1,
        ClientGroupMembership: [
          {
            client_group_id: "group-1",
            client_id: "client-1",
            role: "PRIMARY",
            created_at: new Date(),
            is_contact_only: false,
            is_responsible_for_billing: false,
            is_emergency_contact: false,
            Client: {
              legal_first_name: "John",
              legal_last_name: "Doe",
              preferred_name: null,
            },
          },
        ],
      },
    },
    {
      ...AppointmentFactory.build({
        id: "appointment-2",
        start_date: new Date("2025-05-02T14:00:00Z"),
        end_date: new Date("2025-05-02T15:00:00Z"),
        status: "NO_SHOW",
        type: "COUPLE",
        client_group_id: "group-2",
        clinician_id: "clinician-123",
        title: "Test Appointment 2",
        is_all_day: false,
        location_id: "location-2",
        created_by: "user-2",
      }),
      ClientGroup: {
        ...mockClientGroup2,
        ClientGroupMembership: [
          {
            client_group_id: "group-2",
            client_id: "client-2",
            role: "PRIMARY",
            created_at: new Date(),
            is_contact_only: false,
            is_responsible_for_billing: false,
            is_emergency_contact: false,
            Client: {
              legal_first_name: "Shawaiz",
              legal_last_name: "Sarfraz",
              preferred_name: null,
            },
          },
          {
            client_group_id: "group-2",
            client_id: "client-3",
            role: "SECONDARY",
            created_at: new Date(),
            is_contact_only: false,
            is_responsible_for_billing: false,
            is_emergency_contact: false,
            Client: {
              legal_first_name: "Mrs",
              legal_last_name: "Shawaiz",
              preferred_name: null,
            },
          },
        ],
      },
    },
  ];

  it("should return attendance data with pagination", async () => {
    // Mock implementations
    vi.mocked(getClinicianInfo).mockResolvedValue(mockClinicianInfo);
    vi.mocked(prisma.appointment.findMany).mockResolvedValue(
      mockAppointments as never,
    );
    vi.mocked(prisma.appointment.count).mockResolvedValue(2);

    // Create request
    const url = new URL("http://localhost/api/analytics/attendees");
    url.searchParams.set("startDate", "2025-05-01");
    url.searchParams.set("endDate", "2025-05-31");
    url.searchParams.set("page", "1");
    url.searchParams.set("limit", "20");

    const request = new NextRequest(url);

    // Execute
    const response = await GET(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(2);
    expect(data.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1,
    });

    // Verify the raw appointment data is returned
    expect(data.data[0]).toMatchObject({
      id: "appointment-1",
      status: "SHOW",
      type: "INDIVIDUAL",
      client_group_id: "group-1",
    });

    expect(data.data[1]).toMatchObject({
      id: "appointment-2",
      status: "NO_SHOW",
      type: "COUPLE",
      client_group_id: "group-2",
    });
  });

  it("should filter by status", async () => {
    const filteredAppointments = [mockAppointments[0]];

    vi.mocked(getClinicianInfo).mockResolvedValue(mockClinicianInfo);
    vi.mocked(prisma.appointment.findMany).mockResolvedValue(
      filteredAppointments as never,
    );
    vi.mocked(prisma.appointment.count).mockResolvedValue(1);

    const url = new URL("http://localhost/api/analytics/attendees");
    url.searchParams.set("startDate", "2025-05-01");
    url.searchParams.set("endDate", "2025-05-31");
    url.searchParams.set("status", "SHOW");

    const request = new NextRequest(url);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].status).toBe("SHOW");

    // Verify the where clause was called with status filter
    expect(prisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "SHOW",
        }),
      }),
    );
  });

  it("should filter by client group ID", async () => {
    const filteredAppointments = [mockAppointments[0]];

    vi.mocked(getClinicianInfo).mockResolvedValue(mockClinicianInfo);
    vi.mocked(prisma.appointment.findMany).mockResolvedValue(
      filteredAppointments as never,
    );
    vi.mocked(prisma.appointment.count).mockResolvedValue(1);

    const url = new URL("http://localhost/api/analytics/attendees");
    url.searchParams.set("startDate", "2025-05-01");
    url.searchParams.set("endDate", "2025-05-31");
    url.searchParams.set("clientGroupId", "group-1");

    const request = new NextRequest(url);
    const response = await GET(request);

    expect(response.status).toBe(200);

    // Verify the where clause was called with client group filter
    expect(prisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          client_group_id: "group-1",
        }),
      }),
    );
  });

  it("should return 400 when start date is missing", async () => {
    const url = new URL("http://localhost/api/analytics/attendees");
    url.searchParams.set("endDate", "2025-05-31");

    const request = new NextRequest(url);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Start date and end date are required");
  });

  it("should return 400 when end date is missing", async () => {
    const url = new URL("http://localhost/api/analytics/attendees");
    url.searchParams.set("startDate", "2025-05-01");

    const request = new NextRequest(url);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Start date and end date are required");
  });

  it("should handle pagination correctly", async () => {
    const paginatedAppointments = [mockAppointments[0]];

    vi.mocked(getClinicianInfo).mockResolvedValue(mockClinicianInfo);
    vi.mocked(prisma.appointment.findMany).mockResolvedValue(
      paginatedAppointments as never,
    );
    vi.mocked(prisma.appointment.count).mockResolvedValue(25);

    const url = new URL("http://localhost/api/analytics/attendees");
    url.searchParams.set("startDate", "2025-05-01");
    url.searchParams.set("endDate", "2025-05-31");
    url.searchParams.set("page", "2");
    url.searchParams.set("limit", "10");

    const request = new NextRequest(url);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 25,
      totalPages: 3,
    });

    // Verify skip and take parameters
    expect(prisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10, // (page 2 - 1) * limit 10
        take: 10,
      }),
    );
  });

  it("should handle errors gracefully", async () => {
    // Mock Prisma to throw an error
    vi.mocked(prisma.appointment.findMany).mockRejectedValue(
      new Error("Database error"),
    );

    const url = new URL("http://localhost/api/analytics/attendees");
    url.searchParams.set("startDate", "2025-05-01");
    url.searchParams.set("endDate", "2025-05-31");

    const request = new NextRequest(url);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to fetch attendance data");
  });
});
