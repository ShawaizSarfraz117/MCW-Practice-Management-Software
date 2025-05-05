import { vi } from "vitest";
import { describe, it, expect, beforeEach } from "vitest";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { GET, POST, PUT, DELETE } from "@/api/appointment/route";
import prismaMock from "@mcw/database/mock";
import { AppointmentFactory } from "@mcw/database/mock-data";
import { Decimal } from "@prisma/client/runtime/library";

// Minimal mock for related entities
const mockClinician = {
  id: "clinician-id",
  first_name: "Jane",
  last_name: "Doe",
};
const mockLocation = {
  id: "location-id",
  name: "Main Office",
  address: "123 Main St",
};
const mockClientGroup = {
  id: "group-id",
  name: "Test Group",
  type: "FAMILY",
  is_active: true,
  clinician_id: null,
  available_credit: new Decimal(0),
};

// Helper to build a minimal appointment with all required fields
const mockAppointment = (overrides = {}) =>
  AppointmentFactory.build({
    clinician_id: mockClinician.id,
    location_id: mockLocation.id,
    client_group_id: mockClientGroup.id,
    title: "Therapy Session",
    is_all_day: false,
    created_by: "user-id",
    appointment_fee: new Decimal(100),
    recurring_rule: null,
    recurring_appointment_id: null,
    end_date: new Date(Date.now() + 3600000),
    start_date: new Date(),
    status: "scheduled",
    notes: "",
    type: "consultation",
    service_id: null,
    is_recurring: false,
    cancel_appointments: false,
    notify_cancellation: false,
    adjustable_amount: new Decimal(0),
    write_off: new Decimal(0),
    ...overrides,
  });

describe("Appointment API Unit Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("GET /api/appointment should return all appointments", async () => {
    const appt1 = mockAppointment({ id: "1" });
    const appt2 = mockAppointment({ id: "2" });
    prismaMock.appointment.findMany.mockResolvedValueOnce([appt1, appt2]);

    const req = createRequest("/api/appointment");
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(Array.isArray(json)).toBe(true);
    expect(json).toHaveLength(2);
    expect(json[0]).toHaveProperty("id", appt1.id);
    expect(json[1]).toHaveProperty("id", appt2.id);
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
    const newAppt = mockAppointment();
    prismaMock.clientGroup.findUnique.mockResolvedValueOnce(mockClientGroup);
    prismaMock.appointment.create.mockResolvedValueOnce(newAppt);
    prismaMock.appointment.findUnique.mockResolvedValueOnce(newAppt);

    const apptData = {
      title: "Therapy Session",
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 3600000).toISOString(),
      clinician_id: mockClinician.id,
      location_id: mockLocation.id,
      client_group_id: mockClientGroup.id,
      created_by: "user-id",
      type: "consultation",
    };
    const req = createRequestWithBody("/api/appointment", apptData);
    const response = await POST(req);
    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json).toHaveProperty("id", newAppt.id);
    expect(json).toHaveProperty("title", apptData.title);
  });

  it("PUT /api/appointment should update an existing appointment", async () => {
    const existing = mockAppointment();
    const updated = mockAppointment({ title: "Updated Title" });
    prismaMock.appointment.findUnique.mockResolvedValueOnce(existing);
    prismaMock.appointment.update.mockResolvedValueOnce(updated);
    prismaMock.appointment.findUnique.mockResolvedValueOnce(updated);

    const updateData = {
      id: existing.id,
      title: "Updated Title",
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 3600000).toISOString(),
      location_id: mockLocation.id,
    };
    const req = createRequestWithBody("/api/appointment", updateData, {
      method: "PUT",
    });
    const response = await PUT(req);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toHaveProperty("title", "Updated Title");
  });

  it("DELETE /api/appointment/?id=<id> should delete an appointment", async () => {
    const appt = mockAppointment();
    prismaMock.appointment.findUnique.mockResolvedValueOnce(appt);
    prismaMock.appointment.delete.mockResolvedValueOnce(appt);

    const req = createRequest(`/api/appointment/?id=${appt.id}`, {
      method: "DELETE",
    });
    const response = await DELETE(req);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toHaveProperty("message");
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
