/* eslint-disable max-lines-per-function */
import { vi } from "vitest";
import { describe, it, expect, beforeEach } from "vitest";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { GET, POST, PUT, DELETE } from "@/api/appointment/route";
import prismaMock from "@mcw/database/mock";
import {
  ClinicianFactory,
  ClientGroupFactory,
  LocationFactory,
} from "@mcw/database/mock-data";

describe("Appointment API Unit Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const mockAppointment = (overrides = {}) => ({
    id: "test-id",
    type: "consultation",
    title: "Initial Consultation",
    is_all_day: false,
    start_date: new Date("2023-05-15T10:00:00Z"),
    end_date: new Date("2023-05-15T11:00:00Z"),
    location_id: "location-id",
    created_by: "user-id",
    status: "SCHEDULED",
    client_group_id: "client-group-id",
    clinician_id: "clinician-id",
    appointment_fee: null,
    service_id: null,
    is_recurring: false,
    recurring_rule: null,
    cancel_appointments: false,
    notify_cancellation: false,
    recurring_appointment_id: null,
    ...overrides,
  });

  it("GET /api/appointment should return all appointments", async () => {
    const appointment1 = mockAppointment({ id: "1" });
    const appointment2 = mockAppointment({ id: "2" });
    const appointments = [appointment1, appointment2];

    prismaMock.appointment.findMany.mockResolvedValueOnce(appointments);

    const req = createRequest("/api/appointment");
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toHaveLength(appointments.length);
    expect(json[0]).toHaveProperty("id", appointment1.id);
    expect(json[1]).toHaveProperty("id", appointment2.id);

    expect(prismaMock.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        orderBy: {
          start_date: "asc",
        },
      }),
    );
  });

  it("GET /api/appointment with filters should apply correct filters", async () => {
    const appointments = [mockAppointment()];
    prismaMock.appointment.findMany.mockResolvedValueOnce(appointments);

    const clinicianId = "clinician-123";
    const clientId = "client-123";
    const startDate = "2023-05-01";
    const endDate = "2023-05-31";

    const req = createRequest(
      `/api/appointment?clinicianId=${clinicianId}&clientId=${clientId}&startDate=${startDate}&endDate=${endDate}`,
    );
    const response = await GET(req);

    expect(response.status).toBe(200);

    expect(prismaMock.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          clinician_id: clinicianId,
          start_date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
      }),
    );
  });

  it("GET /api/appointment/?id=<id> should return a specific appointment", async () => {
    const appointment = mockAppointment();
    prismaMock.appointment.findUnique.mockResolvedValueOnce(appointment);

    const req = createRequest(`/api/appointment/?id=${appointment.id}`);
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toHaveProperty("id", appointment.id);
    expect(json).toHaveProperty("type", appointment.type);
    expect(json).toHaveProperty("start_date");
    expect(json).toHaveProperty("end_date");

    expect(prismaMock.appointment.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: appointment.id },
        include: expect.objectContaining({
          ClientGroup: expect.anything(),
          Clinician: expect.anything(),
          Location: expect.anything(),
        }),
      }),
    );
  });

  it("GET /api/appointment/?id=<id> should return 404 for non-existent appointment", async () => {
    prismaMock.appointment.findUnique.mockResolvedValueOnce(null);

    const req = createRequest("/api/appointment/?id=non-existent-id");
    const response = await GET(req);

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Appointment not found");
  });

  it("POST /api/appointment should create a new appointment", async () => {
    const clientGroup = ClientGroupFactory.build();
    const clinician = ClinicianFactory.build();
    const location = LocationFactory.build();

    const createdAppointment = mockAppointment({
      client_group_id: clientGroup.id,
      clinician_id: clinician.id,
      location_id: location.id,
      title: "Therapy Session",
      type: "therapy",
    });

    prismaMock.appointment.create.mockResolvedValueOnce(createdAppointment);

    const appointmentData = {
      title: "Therapy Session",
      type: "therapy",
      start_date: "2023-05-15T10:00:00Z",
      end_date: "2023-05-15T11:00:00Z",
      client_group_id: clientGroup.id,
      clinician_id: clinician.id,
      location_id: location.id,
      created_by: "user-id",
      status: "SCHEDULED",
      is_all_day: false,
    };

    const req = createRequestWithBody("/api/appointment", appointmentData);
    const response = await POST(req);

    expect(response.status).toBe(201);
    const json = await response.json();

    expect(json).toHaveProperty("title", appointmentData.title);
    expect(json).toHaveProperty("type", appointmentData.type);
    expect(json).toHaveProperty("client_group_id", clientGroup.id);
    expect(json).toHaveProperty("clinician_id", clinician.id);

    expect(prismaMock.appointment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: appointmentData.title,
          type: appointmentData.type,
          start_date: expect.any(Date),
          end_date: expect.any(Date),
          client_group_id: clientGroup.id,
          clinician_id: clinician.id,
        }),
        include: expect.anything(),
      }),
    );
  });

  it("POST /api/appointment should return 400 if required fields are missing", async () => {
    const incompleteData = {
      title: "Therapy Session",
      // Missing required fields
    };

    const req = createRequestWithBody("/api/appointment", incompleteData);
    const response = await POST(req);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Missing required fields");
  });

  it("POST /api/appointment should handle recurring appointments", async () => {
    const clientGroup = ClientGroupFactory.build();
    const clinician = ClinicianFactory.build();
    const location = LocationFactory.build();

    const masterAppointment = mockAppointment({
      is_recurring: true,
      recurring_rule: "FREQ=WEEKLY;INTERVAL=1;COUNT=4;BYDAY=MO",
    });

    prismaMock.appointment.create.mockResolvedValueOnce(masterAppointment);

    const appointmentData = {
      title: "Weekly Therapy",
      type: "therapy",
      start_date: "2023-05-15T10:00:00Z",
      end_date: "2023-05-15T11:00:00Z",
      client_group_id: clientGroup.id,
      clinician_id: clinician.id,
      location_id: location.id,
      created_by: "user-id",
      status: "SCHEDULED",
      is_all_day: false,
      is_recurring: true,
      recurring_rule: "FREQ=WEEKLY;INTERVAL=1;COUNT=4;BYDAY=MO",
    };

    const req = createRequestWithBody("/api/appointment", appointmentData);
    const response = await POST(req);

    expect(response.status).toBe(201);
    const json = await response.json();

    expect(Array.isArray(json)).toBe(true);
    expect(json.length).toBeGreaterThan(0);
    expect(json[0]).toHaveProperty("is_recurring", true);
    expect(json[0]).toHaveProperty(
      "recurring_rule",
      appointmentData.recurring_rule,
    );
  });

  it("PUT /api/appointment should update an existing appointment", async () => {
    const existingAppointment = mockAppointment();
    const updatedAppointment = mockAppointment({
      title: "Updated Title",
      status: "CONFIRMED",
    });

    prismaMock.appointment.findUnique.mockResolvedValueOnce(
      existingAppointment,
    );
    prismaMock.appointment.update.mockResolvedValueOnce(updatedAppointment);

    const updateData = {
      id: existingAppointment.id,
      title: "Updated Title",
      status: "CONFIRMED",
    };

    const req = createRequestWithBody("/api/appointment", updateData, {
      method: "PUT",
    });
    const response = await PUT(req);

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toHaveProperty("title", "Updated Title");
    expect(json).toHaveProperty("status", "CONFIRMED");

    expect(prismaMock.appointment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: existingAppointment.id },
        data: expect.objectContaining({
          title: "Updated Title",
          status: "CONFIRMED",
        }),
      }),
    );
  });

  it("PUT /api/appointment should return 404 for non-existent appointment", async () => {
    prismaMock.appointment.findUnique.mockResolvedValueOnce(null);

    const updateData = {
      id: "non-existent-id",
      title: "Updated Title",
    };

    const req = createRequestWithBody("/api/appointment", updateData, {
      method: "PUT",
    });
    const response = await PUT(req);

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Appointment not found");
  });

  it("DELETE /api/appointment/?id=<id> should cancel an appointment", async () => {
    const appointment = mockAppointment();
    const cancelledAppointment = mockAppointment({ status: "CANCELLED" });

    prismaMock.appointment.findUnique.mockResolvedValueOnce(appointment);
    prismaMock.appointment.update.mockResolvedValueOnce(cancelledAppointment);

    const req = createRequest(`/api/appointment/?id=${appointment.id}`, {
      method: "DELETE",
    });
    const response = await DELETE(req);

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toHaveProperty(
      "message",
      "Appointment cancelled successfully",
    );
    expect(json.appointment).toHaveProperty("status", "CANCELLED");

    expect(prismaMock.appointment.update).toHaveBeenCalledWith({
      where: { id: appointment.id },
      data: { status: "CANCELLED" },
    });
  });

  it("DELETE /api/appointment/?id=<id> should return 404 for non-existent appointment", async () => {
    prismaMock.appointment.findUnique.mockResolvedValueOnce(null);

    const req = createRequest("/api/appointment/?id=non-existent-id", {
      method: "DELETE",
    });
    const response = await DELETE(req);

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Appointment not found");
  });
});
