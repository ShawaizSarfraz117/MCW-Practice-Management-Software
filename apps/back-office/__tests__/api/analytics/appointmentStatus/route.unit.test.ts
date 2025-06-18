import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "@/api/analytics/appointmentStatus/route";
import { prisma } from "@mcw/database";
import { createRequest } from "@mcw/utils";
import { logger } from "@mcw/logger";

// Mock dependencies
vi.mock("@mcw/database", () => ({
  prisma: {
    appointment: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock("@mcw/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

// Type for mock appointment data
type MockAppointment = {
  id: string;
  start_date: Date;
  status: string | null;
  ClientGroup: { name: string } | null;
  Invoice: Array<{
    amount: number;
    status: string;
    Payment: Array<{
      amount: number;
      status: string;
    }>;
  }>;
  SurveyAnswers: Array<{
    id: string;
    status: string;
  }>;
};

describe("Appointment Status API Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/analytics/appointmentStatus", () => {
    it("should return appointments with correct status mapping", async () => {
      const mockAppointments: MockAppointment[] = [
        {
          id: "1",
          start_date: new Date("2025-06-01"),
          status: "SHOW",
          ClientGroup: { name: "Client 1" },
          Invoice: [
            {
              amount: 100,
              status: "PAID",
              Payment: [{ amount: 100, status: "Completed" }],
            },
          ],
          SurveyAnswers: [{ id: "note1", status: "COMPLETED" }],
        },
        {
          id: "2",
          start_date: new Date("2025-06-02"),
          status: "NO_SHOW",
          ClientGroup: { name: "Client 2" },
          Invoice: [
            {
              amount: 150,
              status: "UNPAID",
              Payment: [],
            },
          ],
          SurveyAnswers: [],
        },
        {
          id: "3",
          start_date: new Date("2025-06-03"),
          status: "CANCELLED",
          ClientGroup: { name: "Client 3" },
          Invoice: [],
          SurveyAnswers: [],
        },
      ];

      vi.mocked(prisma.appointment.findMany).mockResolvedValue(
        mockAppointments as never,
      );
      vi.mocked(prisma.appointment.count).mockResolvedValue(3);

      const request = createRequest(
        "/api/analytics/appointmentStatus?startDate=2025-06-01&endDate=2025-06-30",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(3);

      // Check first appointment - SHOW status with PAID invoice
      expect(data.data[0]).toEqual({
        id: "1",
        dateOfService: mockAppointments[0].start_date.toISOString(),
        client: "Client 1",
        units: 1,
        totalFee: "$100",
        progressNoteStatus: "COMPLETED",
        status: "SHOW",
        invoiceStatus: "PAID",
        charge: "$100",
        uninvoiced: "--",
        paid: "$100",
        unpaid: "--",
      });

      // Check second appointment - NO_SHOW status with UNPAID invoice
      expect(data.data[1]).toEqual({
        id: "2",
        dateOfService: mockAppointments[1].start_date.toISOString(),
        client: "Client 2",
        units: 1,
        totalFee: "$150",
        progressNoteStatus: "NO NOTE",
        status: "NO_SHOW",
        invoiceStatus: "UNPAID",
        charge: "$150",
        uninvoiced: "--",
        paid: "--",
        unpaid: "$150",
      });

      // Check third appointment - CANCELLED status with no invoice
      expect(data.data[2]).toEqual({
        id: "3",
        dateOfService: mockAppointments[2].start_date.toISOString(),
        client: "Client 3",
        units: 1,
        totalFee: "$0",
        progressNoteStatus: "NO NOTE",
        status: "CANCELLED",
        invoiceStatus: "UNPAID",
        charge: "$0",
        uninvoiced: "$0",
        paid: "--",
        unpaid: "--",
      });
    });

    it("should handle missing date range", async () => {
      const request = createRequest("/api/analytics/appointmentStatus");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing date range");
      expect(prisma.appointment.findMany).not.toHaveBeenCalled();
    });

    it("should filter by status correctly", async () => {
      const request = createRequest(
        "/api/analytics/appointmentStatus?startDate=2025-06-01&endDate=2025-06-30&status=NO_SHOW",
      );
      await GET(request);

      expect(prisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "NO_SHOW",
          }),
        }),
      );
    });

    it("should filter by client ID", async () => {
      const clientId = "client-123";
      const request = createRequest(
        `/api/analytics/appointmentStatus?startDate=2025-06-01&endDate=2025-06-30&clientId=${clientId}`,
      );
      await GET(request);

      expect(prisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            ClientGroup: {
              id: clientId,
            },
          }),
        }),
      );
    });

    it("should handle 'all' client ID correctly", async () => {
      const request = createRequest(
        "/api/analytics/appointmentStatus?startDate=2025-06-01&endDate=2025-06-30&clientId=all",
      );
      await GET(request);

      const callArgs = vi.mocked(prisma.appointment.findMany).mock.calls[0][0];
      expect(callArgs?.where?.ClientGroup).toBeUndefined();
    });

    it("should handle pagination correctly", async () => {
      const mockAppointments: MockAppointment[] = Array.from(
        { length: 5 },
        (_, i) => ({
          id: `${i + 1}`,
          start_date: new Date("2025-06-01"),
          status: "SHOW",
          ClientGroup: { name: `Client ${i + 1}` },
          Invoice: [],
          SurveyAnswers: [],
        }),
      );

      vi.mocked(prisma.appointment.findMany).mockResolvedValue(
        mockAppointments as never,
      );
      vi.mocked(prisma.appointment.count).mockResolvedValue(25);

      const request = createRequest(
        "/api/analytics/appointmentStatus?startDate=2025-06-01&endDate=2025-06-30&page=2&pageSize=5",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(prisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        }),
      );
      expect(data.pagination).toEqual({
        total: 25,
        page: 2,
        pageSize: 5,
        totalPages: 5,
      });
    });

    it("should handle database errors gracefully", async () => {
      vi.mocked(prisma.appointment.findMany).mockRejectedValue(
        new Error("Database connection error"),
      );

      const request = createRequest(
        "/api/analytics/appointmentStatus?startDate=2025-06-01&endDate=2025-06-30",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal Server Error");
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(Error) }),
        "Failed to fetch appointment status analytics",
      );
    });
  });
});
