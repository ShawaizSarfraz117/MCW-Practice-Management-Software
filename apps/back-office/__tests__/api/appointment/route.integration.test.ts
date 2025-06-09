import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { prisma } from "@mcw/database";
import type {
  User,
  Clinician,
  ClientGroup,
  Location,
  PracticeService,
} from "@mcw/database";
import { cleanupDatabase } from "@mcw/database/test-utils";
import { createRequest, createRequestWithBody, generateUUID } from "@mcw/utils";
import { GET, POST, PUT, DELETE } from "@/api/appointment/route";
import {
  UserFactory,
  ClinicianFactory,
  ClientGroupFactory,
  LocationFactory,
  PracticeServiceFactory,
  TagFactory,
} from "@mcw/database/mock-data";

describe("Appointment API Integration Tests", () => {
  let testUser: User;
  let testClinician: Clinician;
  let testClientGroup: ClientGroup;
  let testLocation: Location;
  let testService: PracticeService;

  beforeAll(async () => {
    // Create test data
    testUser = await prisma.user.create({
      data: UserFactory.build(),
    });
    testClinician = await prisma.clinician.create({
      data: {
        ...ClinicianFactory.build(),
        user_id: testUser.id,
      },
    });
    testClientGroup = await prisma.clientGroup.create({
      data: ClientGroupFactory.build(),
    });
    testLocation = await prisma.location.create({
      data: LocationFactory.build(),
    });
    testService = await prisma.practiceService.create({
      data: PracticeServiceFactory.build(),
    });

    // Create default tags
    await Promise.all([
      prisma.tag.create({
        data: TagFactory.build({ name: "Appointment Paid" }),
      }),
      prisma.tag.create({
        data: TagFactory.build({ name: "Appointment Unpaid" }),
      }),
      prisma.tag.create({ data: TagFactory.build({ name: "Note Added" }) }),
      prisma.tag.create({ data: TagFactory.build({ name: "No Note" }) }),
    ]);
  });

  afterEach(async () => {
    // Clean up appointments after each test
    await prisma.appointmentTag.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.invoice.deleteMany({});
    await prisma.appointment.deleteMany({});
  });

  afterAll(async () => {
    // Use the centralized cleanup utility to handle foreign key constraints properly
    await cleanupDatabase(prisma, { verbose: false });
  });

  describe("GET /api/appointment", () => {
    it("should retrieve a specific appointment by id", async () => {
      // Create test appointment
      const appointment = await prisma.appointment.create({
        data: {
          start_date: new Date("2024-01-15T10:00:00Z"),
          end_date: new Date("2024-01-15T11:00:00Z"),
          clinician_id: testClinician.id,
          client_group_id: testClientGroup.id,
          location_id: testLocation.id,
          created_by: testUser.id,
          status: "SCHEDULED",
          type: "APPOINTMENT",
          is_all_day: false,
          is_recurring: false,
        },
      });

      const request = createRequest(`/api/appointment?id=${appointment.id}`);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(appointment.id);
      expect(data.clinician_id).toBe(testClinician.id);
      expect(data.isFirstAppointmentForGroup).toBe(true);
    });

    it("should return 404 for non-existent appointment", async () => {
      const request = createRequest(`/api/appointment?id=${generateUUID()}`);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Appointment not found");
    });

    it("should retrieve all appointments with filters", async () => {
      // Create multiple appointments
      const appointment1 = await prisma.appointment.create({
        data: {
          start_date: new Date("2024-01-15T10:00:00Z"),
          end_date: new Date("2024-01-15T11:00:00Z"),
          clinician_id: testClinician.id,
          client_group_id: testClientGroup.id,
          location_id: testLocation.id,
          created_by: testUser.id,
          status: "SCHEDULED",
          type: "APPOINTMENT",
          is_all_day: false,
          is_recurring: false,
        },
      });

      await prisma.appointment.create({
        data: {
          start_date: new Date("2024-01-20T14:00:00Z"),
          end_date: new Date("2024-01-20T15:00:00Z"),
          clinician_id: testClinician.id,
          client_group_id: testClientGroup.id,
          location_id: testLocation.id,
          created_by: testUser.id,
          status: "SCHEDULED",
          type: "APPOINTMENT",
          is_all_day: false,
          is_recurring: false,
        },
      });

      // Test filtering by date range
      const request = createRequest(
        `/api/appointment?startDate=2024-01-14&endDate=2024-01-16`,
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe(appointment1.id);
    });

    it("should correctly identify first appointment for client group", async () => {
      // Create first appointment
      await prisma.appointment.create({
        data: {
          start_date: new Date("2024-01-15T10:00:00Z"),
          end_date: new Date("2024-01-15T11:00:00Z"),
          clinician_id: testClinician.id,
          client_group_id: testClientGroup.id,
          location_id: testLocation.id,
          created_by: testUser.id,
          status: "SCHEDULED",
          type: "APPOINTMENT",
          is_all_day: false,
          is_recurring: false,
        },
      });

      const request = createRequest("/api/appointment");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data[0].isFirstAppointmentForGroup).toBe(true);

      // Create second appointment
      await prisma.appointment.create({
        data: {
          start_date: new Date("2024-01-20T10:00:00Z"),
          end_date: new Date("2024-01-20T11:00:00Z"),
          clinician_id: testClinician.id,
          client_group_id: testClientGroup.id,
          location_id: testLocation.id,
          created_by: testUser.id,
          status: "SCHEDULED",
          type: "APPOINTMENT",
          is_all_day: false,
          is_recurring: false,
        },
      });

      const response2 = await GET(request);
      const data2 = await response2.json();

      // The second appointment added should have isFirstAppointmentForGroup = false
      // The response is sorted by start_date, so we need to check the proper one
      const secondAppointment = data2.find(
        (apt: { start_date: string | Date }) =>
          new Date(apt.start_date).getTime() ===
          new Date("2024-01-20T10:00:00Z").getTime(),
      );
      expect(secondAppointment.isFirstAppointmentForGroup).toBe(false);
    });
  });

  describe("POST /api/appointment", () => {
    it("should create a new appointment successfully", async () => {
      const appointmentData = {
        title: "Test Appointment",
        start_date: "2024-01-15T10:00:00Z",
        end_date: "2024-01-15T11:00:00Z",
        clinician_id: testClinician.id,
        client_group_id: testClientGroup.id,
        location_id: testLocation.id,
        created_by: testUser.id,
        service_id: testService.id,
      };

      const request = createRequestWithBody(
        "/api/appointment",
        appointmentData,
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBeDefined();
      expect(data.clinician_id).toBe(testClinician.id);
      expect(data.status).toBe("SCHEDULED");

      // Verify appointment was created in database
      const created = await prisma.appointment.findUnique({
        where: { id: data.id },
      });
      expect(created).toBeTruthy();
      expect(created?.client_group_id).toBe(testClientGroup.id);
    });

    it("should return 400 for invalid client group", async () => {
      const appointmentData = {
        title: "Test Appointment",
        start_date: "2024-01-15T10:00:00Z",
        end_date: "2024-01-15T11:00:00Z",
        clinician_id: testClinician.id,
        client_group_id: generateUUID(),
        location_id: testLocation.id,
        created_by: testUser.id,
      };

      const request = createRequestWithBody(
        "/api/appointment",
        appointmentData,
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid client group");
    });

    it("should create recurring appointments", async () => {
      const appointmentData = {
        title: "Recurring Therapy Session",
        start_date: "2024-01-15T10:00:00Z",
        end_date: "2024-01-15T11:00:00Z",
        clinician_id: testClinician.id,
        client_group_id: testClientGroup.id,
        location_id: testLocation.id,
        created_by: testUser.id,
        is_recurring: true,
        recurring_rule: "Weekly",
        recurring_end_date: "2024-02-05",
      };

      const request = createRequestWithBody(
        "/api/appointment",
        appointmentData,
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toBeDefined();
      expect(data.length).toBeGreaterThan(1);

      // Verify appointments were created in database
      const appointments = await prisma.appointment.findMany({
        where: {
          client_group_id: testClientGroup.id,
          is_recurring: true,
          start_date: {
            gte: new Date("2024-01-15T00:00:00Z"),
            lte: new Date("2024-02-05T23:59:59Z"),
          },
        },
      });
      expect(appointments.length).toBeGreaterThan(1);
    });

    it("should handle appointment conflicts gracefully", async () => {
      // Create existing appointment
      await prisma.appointment.create({
        data: {
          title: "Existing Appointment",
          start_date: new Date("2024-01-15T10:00:00Z"),
          end_date: new Date("2024-01-15T11:00:00Z"),
          clinician_id: testClinician.id,
          client_group_id: testClientGroup.id,
          location_id: testLocation.id,
          created_by: testUser.id,
          status: "SCHEDULED",
          type: "APPOINTMENT",
          is_all_day: false,
          is_recurring: false,
        },
      });

      // Try to create conflicting appointment
      const appointmentData = {
        title: "Conflicting Appointment",
        start_date: "2024-01-15T10:30:00Z",
        end_date: "2024-01-15T11:30:00Z",
        clinician_id: testClinician.id,
        client_group_id: testClientGroup.id,
        location_id: testLocation.id,
        created_by: testUser.id,
      };

      const request = createRequestWithBody(
        "/api/appointment",
        appointmentData,
      );
      const response = await POST(request);

      // Should still create as the system allows overlapping appointments
      expect(response.status).toBe(201);
    });
  });

  describe("PUT /api/appointment", () => {
    it("should update a single appointment", async () => {
      const appointment = await prisma.appointment.create({
        data: {
          start_date: new Date("2024-01-15T10:00:00Z"),
          end_date: new Date("2024-01-15T11:00:00Z"),
          clinician_id: testClinician.id,
          client_group_id: testClientGroup.id,
          location_id: testLocation.id,
          created_by: testUser.id,
          status: "SCHEDULED",
          type: "APPOINTMENT",
          is_all_day: false,
          is_recurring: false,
        },
      });

      const updateData = {
        id: appointment.id,
        start_date: appointment.start_date.toISOString(),
        end_date: appointment.end_date.toISOString(),
        location_id: testLocation.id,
        title: "Follow-up Session",
        status: "SCHEDULED",
      };

      const request = createRequestWithBody("/api/appointment", updateData);
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe("Follow-up Session");
      expect(data.status).toBe("SCHEDULED");

      // Verify in database
      const updated = await prisma.appointment.findUnique({
        where: { id: appointment.id },
      });
      expect(updated?.title).toBe("Follow-up Session");
    });

    it("should update recurring appointments with 'this_only' option", async () => {
      // Create master recurring appointment
      const masterAppointment = await prisma.appointment.create({
        data: {
          title: "Recurring Master",
          start_date: new Date("2024-01-15T10:00:00Z"),
          end_date: new Date("2024-01-15T11:00:00Z"),
          clinician_id: testClinician.id,
          client_group_id: testClientGroup.id,
          location_id: testLocation.id,
          created_by: testUser.id,
          status: "SCHEDULED",
          type: "APPOINTMENT",
          is_all_day: false,
          recurring_appointment_id: null,
          recurring_rule: "Weekly",
          is_recurring: true,
        },
      });

      // Create child recurring appointment
      const childAppointment = await prisma.appointment.create({
        data: {
          title: "Recurring Child",
          start_date: new Date("2024-01-22T10:00:00Z"),
          end_date: new Date("2024-01-22T11:00:00Z"),
          clinician_id: testClinician.id,
          client_group_id: testClientGroup.id,
          location_id: testLocation.id,
          created_by: testUser.id,
          status: "SCHEDULED",
          type: "APPOINTMENT",
          is_all_day: false,
          recurring_appointment_id: masterAppointment.id,
          recurring_rule: "Weekly",
          is_recurring: true,
        },
      });

      const updateData = {
        id: childAppointment.id,
        updateOption: "this",
        start_date: childAppointment.start_date.toISOString(),
        end_date: childAppointment.end_date.toISOString(),
        location_id: testLocation.id,
        title: "Updated Single Appointment",
      };

      const request = createRequestWithBody("/api/appointment", updateData);
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe("Updated Single Appointment");

      // Verify the appointment was updated and removed from recurring series
      const updatedChild = await prisma.appointment.findUnique({
        where: { id: childAppointment.id },
      });
      expect(updatedChild?.title).toBe("Updated Single Appointment");
      expect(updatedChild?.recurring_appointment_id).toBeNull();
      expect(updatedChild?.is_recurring).toBe(false);
    });

    it("should return 404 for non-existent appointment", async () => {
      const updateData = {
        id: generateUUID(),
        start_date: "2024-01-15T10:00:00Z",
        end_date: "2024-01-15T11:00:00Z",
        location_id: testLocation.id,
        notes: "Updated notes",
      };

      const request = createRequestWithBody("/api/appointment", updateData);
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Appointment not found");
    });
  });

  describe("DELETE /api/appointment", () => {
    it("should delete a single appointment", async () => {
      const appointment = await prisma.appointment.create({
        data: {
          start_date: new Date("2024-01-15T10:00:00Z"),
          end_date: new Date("2024-01-15T11:00:00Z"),
          clinician_id: testClinician.id,
          client_group_id: testClientGroup.id,
          location_id: testLocation.id,
          created_by: testUser.id,
          status: "SCHEDULED",
          type: "APPOINTMENT",
          is_all_day: false,
          is_recurring: false,
        },
      });

      const request = createRequest(
        `/api/appointment?id=${appointment.id}&deleteOption=single`,
      );
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Appointment deleted successfully");

      // Verify deletion
      const deleted = await prisma.appointment.findUnique({
        where: { id: appointment.id },
      });
      expect(deleted).toBeNull();
    });

    it("should delete all recurring appointments", async () => {
      // Create master recurring appointment
      const masterAppointment = await prisma.appointment.create({
        data: {
          title: "Master Recurring for Delete",
          start_date: new Date("2024-01-15T10:00:00Z"),
          end_date: new Date("2024-01-15T11:00:00Z"),
          clinician_id: testClinician.id,
          client_group_id: testClientGroup.id,
          location_id: testLocation.id,
          created_by: testUser.id,
          status: "SCHEDULED",
          type: "APPOINTMENT",
          is_all_day: false,
          recurring_appointment_id: null,
          recurring_rule: "Weekly",
          is_recurring: true,
        },
      });

      // Create child recurring appointments
      await Promise.all([
        prisma.appointment.create({
          data: {
            title: "Child Recurring 1",
            start_date: new Date("2024-01-22T10:00:00Z"),
            end_date: new Date("2024-01-22T11:00:00Z"),
            clinician_id: testClinician.id,
            client_group_id: testClientGroup.id,
            location_id: testLocation.id,
            created_by: testUser.id,
            status: "SCHEDULED",
            type: "APPOINTMENT",
            is_all_day: false,
            recurring_appointment_id: masterAppointment.id,
            recurring_rule: "Weekly",
            is_recurring: true,
          },
        }),
        prisma.appointment.create({
          data: {
            title: "Child Recurring 2",
            start_date: new Date("2024-01-29T10:00:00Z"),
            end_date: new Date("2024-01-29T11:00:00Z"),
            clinician_id: testClinician.id,
            client_group_id: testClientGroup.id,
            location_id: testLocation.id,
            created_by: testUser.id,
            status: "SCHEDULED",
            type: "APPOINTMENT",
            is_all_day: false,
            recurring_appointment_id: masterAppointment.id,
            recurring_rule: "Weekly",
            is_recurring: true,
          },
        }),
      ]);

      const request = createRequest(
        `/api/appointment?id=${masterAppointment.id}&deleteOption=all`,
      );
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe(
        "All appointments in the series deleted successfully",
      );

      // Verify all were deleted
      const remaining = await prisma.appointment.findMany({
        where: {
          OR: [
            { id: masterAppointment.id },
            { recurring_appointment_id: masterAppointment.id },
          ],
        },
      });
      expect(remaining).toHaveLength(0);
    });

    it("should return 400 when appointment ID is missing", async () => {
      const request = createRequest("/api/appointment");
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Appointment ID is required");
    });
  });
});
