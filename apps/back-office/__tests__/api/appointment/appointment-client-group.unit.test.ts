import { vi } from "vitest";
import { describe, it, expect, beforeEach } from "vitest";
import { createRequestWithBody } from "@mcw/utils";
import { POST } from "@/api/appointment/route";
import prismaMock from "@mcw/database/mock";
import { Decimal } from "@prisma/client/runtime/library";

// Mock data
const mockUser = {
  id: "user-123",
  email: "test@example.com",
  password_hash: "hashed",
  last_login: new Date(),
  date_of_birth: new Date("1990-01-01"),
  phone: "+1234567890",
  profile_photo: null,
};

const mockClientGroup = {
  id: "client-group-123",
  name: "Smith Family Group",
  type: "family",
  clinician_id: "clinician-123",
  is_active: true,
  available_credit: new Decimal(0),
  created_at: new Date(),
  auto_monthly_statement_enabled: false,
  auto_monthly_superbill_enabled: false,
  first_seen_at: new Date(),
  notes: null,
};

const mockClinician = {
  id: "clinician-123",
  user_id: "user-456",
  first_name: "Dr. John",
  last_name: "Doe",
  address: "123 Medical St",
  percentage_split: 70,
  is_active: true,
  speciality: "Family Therapy",
  NPI_number: "1234567890",
  taxonomy_code: "207Q00000X",
};

const mockLocation = {
  id: "location-123",
  name: "Main Office",
  address: "123 Main St",
  is_active: true,
  city: "Boston",
  state: "MA",
  street: "123 Main St",
  zip: "02115",
  color: "#2d8467",
};

describe("Appointment Client Group Name Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("POST /api/appointment should create appointment with proper client group name in title", async () => {
    // Setup mocks
    prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);
    prismaMock.clientGroup.findUnique.mockResolvedValueOnce(mockClientGroup);
    prismaMock.appointmentLimit.findFirst.mockResolvedValueOnce(null);
    prismaMock.appointment.count.mockResolvedValueOnce(0);

    const expectedAppointment = {
      id: "appt-123",
      type: "APPOINTMENT",
      title: "Appointment with Smith Family Group", // This should use the actual client group name
      is_all_day: false,
      start_date: new Date("2024-01-10T10:00:00.000Z"),
      end_date: new Date("2024-01-10T11:00:00.000Z"),
      location_id: mockLocation.id,
      created_by: mockUser.id,
      status: "SCHEDULED",
      clinician_id: mockClinician.id,
      appointment_fee: new Decimal(150),
      service_id: "service-123",
      is_recurring: false,
      recurring_rule: null,
      recurring_appointment_id: null,
      client_group_id: mockClientGroup.id,
      cancel_appointments: false,
      notify_cancellation: false,
      adjustable_amount: new Decimal(0),
      write_off: new Decimal(0),
      superbill_id: null,
    };

    prismaMock.appointment.create.mockResolvedValueOnce(expectedAppointment);
    prismaMock.clientGroup.findUnique.mockResolvedValueOnce(mockClientGroup);

    // Create request
    const appointmentData = {
      type: "APPOINTMENT",
      title: "Appointment with Smith Family Group",
      is_all_day: false,
      start_date: "2024-01-10T10:00:00.000Z",
      end_date: "2024-01-10T11:00:00.000Z",
      location_id: mockLocation.id,
      created_by: mockUser.id,
      status: "SCHEDULED",
      client_group_id: mockClientGroup.id,
      clinician_id: mockClinician.id,
      service_id: "service-123",
      appointment_fee: 150,
    };

    const req = createRequestWithBody("/api/appointment", appointmentData);
    const response = await POST(req);

    // Assertions
    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json).toHaveProperty("title", "Appointment with Smith Family Group");
    expect(prismaMock.appointment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "Appointment with Smith Family Group",
          client_group_id: mockClientGroup.id,
        }),
      }),
    );
  });

  it("POST /api/appointment should handle event type without client group", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);

    const expectedEvent = {
      id: "event-123",
      type: "event",
      title: "Team Meeting",
      is_all_day: false,
      start_date: new Date("2024-01-10T14:00:00.000Z"),
      end_date: new Date("2024-01-10T15:00:00.000Z"),
      location_id: mockLocation.id,
      created_by: mockUser.id,
      status: "SCHEDULED",
      clinician_id: mockClinician.id,
      appointment_fee: null,
      service_id: null,
      is_recurring: false,
      recurring_rule: null,
      recurring_appointment_id: null,
      client_group_id: null,
      cancel_appointments: false,
      notify_cancellation: false,
      adjustable_amount: new Decimal(0),
      write_off: new Decimal(0),
      superbill_id: null,
    };

    prismaMock.appointment.create.mockResolvedValueOnce(expectedEvent);

    const eventData = {
      type: "event",
      title: "Team Meeting",
      is_all_day: false,
      start_date: "2024-01-10T14:00:00.000Z",
      end_date: "2024-01-10T15:00:00.000Z",
      location_id: mockLocation.id,
      created_by: mockUser.id,
      status: "SCHEDULED",
      clinician_id: mockClinician.id,
    };

    const req = createRequestWithBody("/api/appointment", eventData);
    const response = await POST(req);

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json).toHaveProperty("title", "Team Meeting");
    expect(json).toHaveProperty("client_group_id", null);
  });

  it("POST /api/appointment should create appointment even if created_by user doesn't exist in DB", async () => {
    // The current implementation doesn't validate created_by user exists
    // This test documents the actual behavior
    prismaMock.clientGroup.findUnique.mockResolvedValueOnce(mockClientGroup);
    prismaMock.appointmentLimit.findFirst.mockResolvedValueOnce(null);
    prismaMock.appointment.count.mockResolvedValueOnce(0);

    const expectedAppointment = {
      id: "appt-456",
      type: "APPOINTMENT",
      title: "Appointment with Smith Family Group",
      is_all_day: false,
      start_date: new Date("2024-01-10T10:00:00.000Z"),
      end_date: new Date("2024-01-10T11:00:00.000Z"),
      location_id: mockLocation.id,
      created_by: "non-existent-user",
      status: "SCHEDULED",
      clinician_id: mockClinician.id,
      client_group_id: mockClientGroup.id,
      appointment_fee: new Decimal(150),
      service_id: null,
      is_recurring: false,
      recurring_rule: null,
      recurring_appointment_id: null,
      cancel_appointments: false,
      notify_cancellation: false,
      adjustable_amount: new Decimal(0),
      write_off: new Decimal(0),
      superbill_id: null,
    };

    prismaMock.appointment.create.mockResolvedValueOnce(expectedAppointment);

    const appointmentData = {
      type: "APPOINTMENT",
      title: "Appointment with Smith Family Group",
      start_date: "2024-01-10T10:00:00.000Z",
      end_date: "2024-01-10T11:00:00.000Z",
      location_id: mockLocation.id,
      created_by: "non-existent-user",
      clinician_id: mockClinician.id,
      client_group_id: mockClientGroup.id,
    };

    const req = createRequestWithBody("/api/appointment", appointmentData);
    const response = await POST(req);

    // The appointment creation succeeds even without user validation
    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json).toHaveProperty("id");
  });

  it("POST /api/appointment should validate client group exists", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);
    prismaMock.clientGroup.findUnique.mockResolvedValueOnce(null);

    const appointmentData = {
      type: "APPOINTMENT",
      title: "Appointment with Unknown Client",
      start_date: "2024-01-10T10:00:00.000Z",
      end_date: "2024-01-10T11:00:00.000Z",
      location_id: mockLocation.id,
      created_by: mockUser.id,
      clinician_id: mockClinician.id,
      client_group_id: "non-existent-group",
    };

    const req = createRequestWithBody("/api/appointment", appointmentData);
    const response = await POST(req);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Invalid client group");
  });
});
