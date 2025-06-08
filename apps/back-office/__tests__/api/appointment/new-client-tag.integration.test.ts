import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@mcw/database";
import { POST } from "@/api/appointment/route";
import { createRequestWithBody } from "@mcw/utils";
import { AppointmentTagName } from "@/types/entities/appointment";
import { randomUUID } from "crypto";

describe("New Client Tag - Integration Tests", () => {
  let testClinicianId: string;
  let testLocationId: string;
  let testUserId: string;
  let testServiceId: string;
  let createdAppointmentIds: string[] = [];
  let createdClientGroupIds: string[] = [];
  let createdClientIds: string[] = [];

  beforeEach(async () => {
    // Create test user with unique email
    const timestamp = Date.now();
    const testUser = await prisma.user.create({
      data: {
        email: `test-clinician-${timestamp}@example.com`,
        password_hash: "hashed_password",
      },
    });
    testUserId = testUser.id;

    // Create test clinician
    const testClinician = await prisma.clinician.create({
      data: {
        user_id: testUserId,
        first_name: "Test",
        last_name: "Clinician",
        address: "123 Test St",
        percentage_split: 50,
      },
    });
    testClinicianId = testClinician.id;

    // Create test location
    const testLocation = await prisma.location.create({
      data: {
        name: "Test Location",
        address: "123 Test Ave",
      },
    });
    testLocationId = testLocation.id;

    // Create test service
    const testService = await prisma.practiceService.create({
      data: {
        type: "Individual Therapy",
        rate: 150,
        code: "90834",
        duration: 50,
      },
    });
    testServiceId = testService.id;

    // Create or find required tags
    // Find new client tag or create it
    const newClientTag = await prisma.tag.findFirst({
      where: {
        name: AppointmentTagName.NEW_CLIENT as string,
      },
    });

    if (!newClientTag) {
      await prisma.tag.create({
        data: {
          name: AppointmentTagName.NEW_CLIENT as string,
          color: "#00FF00",
        },
      });
    }

    // Find unpaid tag or create it
    const unpaidTag = await prisma.tag.findFirst({
      where: {
        name: AppointmentTagName.APPOINTMENT_UNPAID as string,
      },
    });

    if (!unpaidTag) {
      await prisma.tag.create({
        data: {
          name: AppointmentTagName.APPOINTMENT_UNPAID as string,
          color: "#FF0000",
        },
      });
    }

    // Find no note tag or create it
    const noNoteTag = await prisma.tag.findFirst({
      where: {
        name: AppointmentTagName.NO_NOTE as string,
      },
    });

    if (!noNoteTag) {
      await prisma.tag.create({
        data: {
          name: AppointmentTagName.NO_NOTE as string,
          color: "#FFFF00",
        },
      });
    }
  }, 30000);

  afterEach(async () => {
    // Clean up created data
    if (createdAppointmentIds.length > 0) {
      await prisma.appointmentTag.deleteMany({
        where: { appointment_id: { in: createdAppointmentIds } },
      });
      await prisma.appointment.deleteMany({
        where: { id: { in: createdAppointmentIds } },
      });
    }

    if (createdClientGroupIds.length > 0) {
      await prisma.clientGroupMembership.deleteMany({
        where: { client_group_id: { in: createdClientGroupIds } },
      });
      await prisma.clientGroup.deleteMany({
        where: { id: { in: createdClientGroupIds } },
      });
    }

    if (createdClientIds.length > 0) {
      // Delete client contacts first to avoid FK constraint
      await prisma.clientContact.deleteMany({
        where: { client_id: { in: createdClientIds } },
      });
      await prisma.client.deleteMany({
        where: { id: { in: createdClientIds } },
      });
    }

    // Clean up test data
    if (testServiceId) {
      await prisma.practiceService.delete({ where: { id: testServiceId } });
    }
    if (testLocationId) {
      await prisma.location.delete({ where: { id: testLocationId } });
    }
    if (testClinicianId) {
      await prisma.clinician.delete({ where: { id: testClinicianId } });
    }
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } });
    }

    createdAppointmentIds = [];
    createdClientGroupIds = [];
    createdClientIds = [];
  });

  describe("New Client Detection", () => {
    it("should add New Client tag for first appointment of a client group", async () => {
      // Create a new client
      const newClient = await prisma.client.create({
        data: {
          legal_first_name: "New",
          legal_last_name: "Client",
          is_active: true,
        },
      });
      createdClientIds.push(newClient.id);

      // Create a new client group
      const newClientGroup = await prisma.clientGroup.create({
        data: {
          id: randomUUID(),
          type: "individual",
          name: "New Client",
          clinician_id: testClinicianId,
        },
      });
      createdClientGroupIds.push(newClientGroup.id);

      // Add client to group
      await prisma.clientGroupMembership.create({
        data: {
          client_id: newClient.id,
          client_group_id: newClientGroup.id,
          role: "primary",
        },
      });

      // Create first appointment for this client group
      const appointmentData = {
        type: "appointment",
        title: "First Appointment",
        is_all_day: false,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        location_id: testLocationId,
        client_group_id: newClientGroup.id,
        clinician_id: testClinicianId,
        created_by: testUserId,
        status: "SCHEDULED",
        service_id: testServiceId,
        appointment_fee: 150,
      };

      const request = createRequestWithBody(
        "/api/appointment",
        appointmentData,
      );
      const response = await POST(request);

      expect(response.status).toBe(201);
      const responseData = await response.json();

      // Store appointment ID for cleanup
      createdAppointmentIds.push(responseData.id);

      // Verify appointment was created with tags
      expect(responseData.AppointmentTag).toBeDefined();
      expect(Array.isArray(responseData.AppointmentTag)).toBe(true);

      // Check for New Client tag
      const hasNewClientTag = responseData.AppointmentTag.some(
        (tag: { Tag: { name: string } }) =>
          tag.Tag.name === AppointmentTagName.NEW_CLIENT,
      );
      expect(hasNewClientTag).toBe(true);

      // Also check for default tags
      const hasUnpaidTag = responseData.AppointmentTag.some(
        (tag: { Tag: { name: string } }) =>
          tag.Tag.name === AppointmentTagName.APPOINTMENT_UNPAID,
      );
      const hasNoNoteTag = responseData.AppointmentTag.some(
        (tag: { Tag: { name: string } }) =>
          tag.Tag.name === AppointmentTagName.NO_NOTE,
      );
      expect(hasUnpaidTag).toBe(true);
      expect(hasNoNoteTag).toBe(true);
    });

    it("should NOT add New Client tag for subsequent appointments", async () => {
      // Create a client with existing appointment
      const existingClient = await prisma.client.create({
        data: {
          legal_first_name: "Existing",
          legal_last_name: "Client",
          is_active: true,
        },
      });
      createdClientIds.push(existingClient.id);

      // Create client group
      const existingClientGroup = await prisma.clientGroup.create({
        data: {
          id: randomUUID(),
          type: "individual",
          name: "Existing Client",
          clinician_id: testClinicianId,
        },
      });
      createdClientGroupIds.push(existingClientGroup.id);

      // Add client to group
      await prisma.clientGroupMembership.create({
        data: {
          client_id: existingClient.id,
          client_group_id: existingClientGroup.id,
          role: "primary",
        },
      });

      // Create first appointment (without using API to avoid tag logic)
      const firstAppointment = await prisma.appointment.create({
        data: {
          type: "appointment",
          title: "First Appointment",
          is_all_day: false,
          start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
          end_date: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000,
          ),
          location_id: testLocationId,
          client_group_id: existingClientGroup.id,
          clinician_id: testClinicianId,
          created_by: testUserId,
          status: "SHOW",
        },
      });
      createdAppointmentIds.push(firstAppointment.id);

      // Now create second appointment via API
      const appointmentData = {
        type: "appointment",
        title: "Second Appointment",
        is_all_day: false,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        location_id: testLocationId,
        client_group_id: existingClientGroup.id,
        clinician_id: testClinicianId,
        created_by: testUserId,
        status: "SCHEDULED",
        service_id: testServiceId,
        appointment_fee: 150,
      };

      const request = createRequestWithBody(
        "/api/appointment",
        appointmentData,
      );
      const response = await POST(request);

      expect(response.status).toBe(201);
      const responseData = await response.json();

      // Store appointment ID for cleanup
      createdAppointmentIds.push(responseData.id);

      // Verify NO New Client tag
      const hasNewClientTag = responseData.AppointmentTag?.some(
        (tag: { Tag: { name: string } }) =>
          tag.Tag.name === AppointmentTagName.NEW_CLIENT,
      );
      expect(hasNewClientTag).toBe(false);

      // Should still have default tags
      const hasUnpaidTag = responseData.AppointmentTag?.some(
        (tag: { Tag: { name: string } }) =>
          tag.Tag.name === AppointmentTagName.APPOINTMENT_UNPAID,
      );
      expect(hasUnpaidTag).toBe(true);
    });

    it("should handle events (no client group) without errors", async () => {
      // Create event without client group
      const eventData = {
        type: "event", // lowercase to match API validation
        title: "Staff Meeting",
        is_all_day: false,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        location_id: testLocationId,
        clinician_id: testClinicianId,
        created_by: testUserId,
        status: "SCHEDULED",
      };

      const request = createRequestWithBody("/api/appointment", eventData);
      const response = await POST(request);

      expect(response.status).toBe(201);
      const responseData = await response.json();

      // Store appointment ID for cleanup
      createdAppointmentIds.push(responseData.id);

      // Events should not have New Client tag
      const hasNewClientTag = responseData.AppointmentTag?.some(
        (tag: { Tag: { name: string } }) =>
          tag.Tag.name === AppointmentTagName.NEW_CLIENT,
      );
      expect(hasNewClientTag).toBe(false);
    });

    it("should include client group data in response for new client", async () => {
      // Create a new client with email
      const newClient = await prisma.client.create({
        data: {
          legal_first_name: "Jane",
          legal_last_name: "Doe",
          is_active: true,
        },
      });
      createdClientIds.push(newClient.id);

      // Add client contact
      await prisma.clientContact.create({
        data: {
          client_id: newClient.id,
          is_primary: true,
          permission: "CLIENT_ONLY",
          contact_type: "EMAIL",
          type: "WORK",
          value: "jane.doe@example.com",
        },
      });

      // Create a new client group
      const newClientGroup = await prisma.clientGroup.create({
        data: {
          id: randomUUID(),
          type: "individual",
          name: "Jane Doe",
          clinician_id: testClinicianId,
        },
      });
      createdClientGroupIds.push(newClientGroup.id);

      // Add client to group
      await prisma.clientGroupMembership.create({
        data: {
          client_id: newClient.id,
          client_group_id: newClientGroup.id,
          role: "primary",
        },
      });

      // Create appointment
      const appointmentData = {
        type: "appointment",
        title: "Initial Session",
        is_all_day: false,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        location_id: testLocationId,
        client_group_id: newClientGroup.id,
        clinician_id: testClinicianId,
        created_by: testUserId,
        status: "SCHEDULED",
        service_id: testServiceId,
        appointment_fee: 150,
      };

      const request = createRequestWithBody(
        "/api/appointment",
        appointmentData,
      );
      const response = await POST(request);

      expect(response.status).toBe(201);
      const responseData = await response.json();

      // Store appointment ID for cleanup
      createdAppointmentIds.push(responseData.id);

      // Verify client group data is included
      expect(responseData.ClientGroup).toBeDefined();
      expect(responseData.ClientGroup.id).toBe(newClientGroup.id);
      expect(responseData.ClientGroup.ClientGroupMembership).toBeDefined();
      expect(responseData.ClientGroup.ClientGroupMembership).toHaveLength(1);

      const membership = responseData.ClientGroup.ClientGroupMembership[0];
      expect(membership.Client).toBeDefined();
      expect(membership.Client.legal_first_name).toBe("Jane");
      expect(membership.Client.legal_last_name).toBe("Doe");
    });
  });

  describe("Recurring Appointments", () => {
    it("should add New Client tag only to the master appointment", async () => {
      // Create a new client
      const newClient = await prisma.client.create({
        data: {
          legal_first_name: "Recurring",
          legal_last_name: "Client",
          is_active: true,
        },
      });
      createdClientIds.push(newClient.id);

      // Create a new client group
      const newClientGroup = await prisma.clientGroup.create({
        data: {
          id: randomUUID(),
          type: "individual",
          name: "Recurring Client",
          clinician_id: testClinicianId,
        },
      });
      createdClientGroupIds.push(newClientGroup.id);

      // Add client to group
      await prisma.clientGroupMembership.create({
        data: {
          client_id: newClient.id,
          client_group_id: newClientGroup.id,
          role: "primary",
        },
      });

      // Create recurring appointment
      const appointmentData = {
        type: "appointment",
        title: "Weekly Therapy",
        is_all_day: false,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        location_id: testLocationId,
        client_group_id: newClientGroup.id,
        clinician_id: testClinicianId,
        created_by: testUserId,
        status: "SCHEDULED",
        service_id: testServiceId,
        appointment_fee: 150,
        is_recurring: true,
        recurring_rule: "FREQ=WEEKLY;COUNT=4", // 4 weekly appointments
      };

      const request = createRequestWithBody(
        "/api/appointment",
        appointmentData,
      );
      const response = await POST(request);

      expect(response.status).toBe(201);
      const responseData = await response.json();

      // Response should be an array for recurring appointments
      expect(Array.isArray(responseData)).toBe(true);
      expect(responseData.length).toBeGreaterThan(1);

      // Store all appointment IDs for cleanup
      responseData.forEach((apt: { id: string }) =>
        createdAppointmentIds.push(apt.id),
      );

      // Only the first (master) appointment should have New Client tag
      const firstAppointment = responseData[0];
      const hasNewClientTag = firstAppointment.AppointmentTag?.some(
        (tag: { Tag: { name: string } }) =>
          tag.Tag.name === AppointmentTagName.NEW_CLIENT,
      );
      expect(hasNewClientTag).toBe(true);

      // Subsequent appointments should NOT have New Client tag
      for (let i = 1; i < responseData.length; i++) {
        const recurringAppointment = responseData[i];
        const hasNewClientTagInRecurring =
          recurringAppointment.AppointmentTag?.some(
            (tag: { Tag: { name: string } }) =>
              tag.Tag.name === AppointmentTagName.NEW_CLIENT,
          );
        expect(hasNewClientTagInRecurring).toBe(false);
      }
    });
  });
});
