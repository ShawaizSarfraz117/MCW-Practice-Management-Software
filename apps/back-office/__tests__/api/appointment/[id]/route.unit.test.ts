import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import prismaMock from "@mcw/database/mock";
import { createRequestWithBody } from "@mcw/utils";
import { PUT } from "@/api/appointment/[id]/route";
import { createAppointmentWithRelations } from "@mcw/database/mock-data";
import { Decimal } from "@prisma/client/runtime/library";

describe("Appointment [id] API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("PUT /api/appointment/[id]", () => {
    it("should update appointment fee and write-off successfully", async () => {
      const appointmentId = "appointment-123";
      const existingAppointment = createAppointmentWithRelations({
        id: appointmentId,
        appointment_fee: new Decimal(100),
        write_off: new Decimal(0),
        adjustable_amount: new Decimal(0),
      });

      prismaMock.appointment.findUnique.mockResolvedValue(existingAppointment);
      prismaMock.appointment.update.mockResolvedValue({
        ...existingAppointment,
        appointment_fee: new Decimal(150),
        write_off: new Decimal(10),
        adjustable_amount: new Decimal(40),
      });

      const updateData = {
        fee: 150,
        writeOff: 10,
        serviceId: "service-123",
      };

      const request = createRequestWithBody(
        `/api/appointment/${appointmentId}`,
        updateData,
      );
      const response = await PUT(request, { params: { id: appointmentId } });
      const data = await response.json();

      expect(prismaMock.appointment.update).toHaveBeenCalledWith({
        where: { id: appointmentId },
        data: {
          appointment_fee: 150,
          write_off: 10,
          adjustable_amount: 40, // (150-100) - (10-0) = 40
        },
      });

      expect(response.status).toBe(200);
      expect(data.appointment_fee).toBe("150");
      expect(data.write_off).toBe("10");
    });

    it("should only update service when fee and write-off are unchanged", async () => {
      const appointmentId = "appointment-123";
      const existingAppointment = createAppointmentWithRelations({
        id: appointmentId,
        appointment_fee: new Decimal(100),
        write_off: new Decimal(10),
        service_id: "old-service",
      });

      prismaMock.appointment.findUnique.mockResolvedValue(existingAppointment);
      prismaMock.appointment.update.mockResolvedValue({
        ...existingAppointment,
        service_id: "new-service",
      });

      const updateData = {
        fee: 100,
        writeOff: 10,
        serviceId: "new-service",
      };

      const request = createRequestWithBody(
        `/api/appointment/${appointmentId}`,
        updateData,
      );
      const response = await PUT(request, { params: { id: appointmentId } });
      const data = await response.json();

      expect(prismaMock.appointment.update).toHaveBeenCalledWith({
        where: { id: appointmentId },
        data: {
          service_id: "new-service",
        },
      });

      expect(response.status).toBe(200);
      expect(data.service_id).toBe("new-service");
    });

    it("should calculate adjustable amount correctly with existing amount", async () => {
      const appointmentId = "appointment-123";
      const existingAppointment = createAppointmentWithRelations({
        id: appointmentId,
        appointment_fee: new Decimal(100),
        write_off: new Decimal(10),
        adjustable_amount: new Decimal(20),
      });

      prismaMock.appointment.findUnique.mockResolvedValue(existingAppointment);
      prismaMock.appointment.update.mockResolvedValue({
        ...existingAppointment,
        appointment_fee: new Decimal(150),
        write_off: new Decimal(20),
        adjustable_amount: new Decimal(60),
      });

      const updateData = {
        fee: 150,
        writeOff: 20,
        serviceId: "service-123",
      };

      const request = createRequestWithBody(
        `/api/appointment/${appointmentId}`,
        updateData,
      );
      const response = await PUT(request, { params: { id: appointmentId } });

      expect(prismaMock.appointment.update).toHaveBeenCalledWith({
        where: { id: appointmentId },
        data: {
          appointment_fee: 150,
          write_off: 20,
          adjustable_amount: 60, // 20 + (150-100) - (20-10) = 60
        },
      });

      expect(response.status).toBe(200);
    });

    it("should return 404 when appointment not found", async () => {
      const appointmentId = "non-existent";
      prismaMock.appointment.findUnique.mockResolvedValue(null);

      const updateData = {
        fee: 150,
        writeOff: 10,
        serviceId: "service-123",
      };

      const request = createRequestWithBody(
        `/api/appointment/${appointmentId}`,
        updateData,
      );
      const response = await PUT(request, { params: { id: appointmentId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Appointment not found");
    });

    it("should handle appointments with invoices", async () => {
      const appointmentId = "appointment-123";
      const existingAppointment = createAppointmentWithRelations({
        id: appointmentId,
        appointment_fee: new Decimal(100),
        write_off: new Decimal(0),
      });

      prismaMock.appointment.findUnique.mockResolvedValue(existingAppointment);
      prismaMock.appointment.update.mockResolvedValue({
        ...existingAppointment,
        appointment_fee: new Decimal(200),
        write_off: new Decimal(0),
        adjustable_amount: new Decimal(100),
      });

      const updateData = {
        fee: 200,
        writeOff: 0,
        serviceId: "service-123",
      };

      const request = createRequestWithBody(
        `/api/appointment/${appointmentId}`,
        updateData,
      );
      const response = await PUT(request, { params: { id: appointmentId } });

      expect(response.status).toBe(200);
      expect(prismaMock.appointment.findUnique).toHaveBeenCalledWith({
        where: { id: appointmentId },
        include: { Invoice: true },
      });
    });

    it("should handle decimal precision correctly", async () => {
      const appointmentId = "appointment-123";
      const existingAppointment = createAppointmentWithRelations({
        id: appointmentId,
        appointment_fee: new Decimal("99.99"),
        write_off: new Decimal("9.99"),
        adjustable_amount: new Decimal(0),
      });

      prismaMock.appointment.findUnique.mockResolvedValue(existingAppointment);
      prismaMock.appointment.update.mockResolvedValue({
        ...existingAppointment,
        appointment_fee: new Decimal("149.99"),
        write_off: new Decimal("19.99"),
        adjustable_amount: new Decimal(40),
      });

      const updateData = {
        fee: 149.99,
        writeOff: 19.99,
        serviceId: "service-123",
      };

      const request = createRequestWithBody(
        `/api/appointment/${appointmentId}`,
        updateData,
      );
      const response = await PUT(request, { params: { id: appointmentId } });

      expect(prismaMock.appointment.update).toHaveBeenCalledWith({
        where: { id: appointmentId },
        data: {
          appointment_fee: 149.99,
          write_off: 19.99,
          adjustable_amount: expect.closeTo(40, 5),
        },
      });

      expect(response.status).toBe(200);
    });

    it("should handle null adjustable_amount", async () => {
      const appointmentId = "appointment-123";
      const existingAppointment = createAppointmentWithRelations({
        id: appointmentId,
        appointment_fee: new Decimal(100),
        write_off: new Decimal(0),
        adjustable_amount: null,
      });

      prismaMock.appointment.findUnique.mockResolvedValue(existingAppointment);
      prismaMock.appointment.update.mockResolvedValue({
        ...existingAppointment,
        appointment_fee: new Decimal(150),
        write_off: new Decimal(10),
        adjustable_amount: new Decimal(40),
      });

      const updateData = {
        fee: 150,
        writeOff: 10,
        serviceId: "service-123",
      };

      const request = createRequestWithBody(
        `/api/appointment/${appointmentId}`,
        updateData,
      );
      const response = await PUT(request, { params: { id: appointmentId } });

      expect(prismaMock.appointment.update).toHaveBeenCalledWith({
        where: { id: appointmentId },
        data: {
          appointment_fee: 150,
          write_off: 10,
          adjustable_amount: expect.closeTo(40, 5),
        },
      });

      expect(response.status).toBe(200);
    });
  });
});
