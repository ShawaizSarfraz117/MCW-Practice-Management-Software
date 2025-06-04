import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createRequestWithBody, createRequest } from "@mcw/utils";
import { POST, GET } from "@/api/appointment/route";
import { prisma } from "@mcw/database";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

describe("Appointment Client Group Integration Tests", () => {
  let testUser: { id: string };
  let testClinician: { id: string };
  let testLocation: { id: string };
  let testClientGroup: { id: string; name: string };
  let testService: { id: string };

  beforeEach(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: `test-${Date.now()}@example.com`,
        password_hash: await bcrypt.hash("password123", 10),
        date_of_birth: new Date("1990-01-01"),
        phone: "+1234567890",
      },
    });

    // Create test clinician
    testClinician = await prisma.clinician.create({
      data: {
        id: uuidv4(),
        user_id: testUser.id,
        first_name: "Test",
        last_name: "Clinician",
        address: "123 Test St",
        percentage_split: 70,
        is_active: true,
        speciality: "Testing",
        NPI_number: "1234567890",
        taxonomy_code: "207Q00000X",
      },
    });

    // Create test location
    testLocation = await prisma.location.create({
      data: {
        id: uuidv4(),
        name: "Test Location",
        address: "456 Test Ave",
        is_active: true,
        city: "Test City",
        state: "TS",
        street: "456 Test Ave",
        zip: "12345",
      },
    });

    // Create test client group with a specific name
    testClientGroup = await prisma.clientGroup.create({
      data: {
        id: uuidv4(),
        type: "family",
        name: "Johnson Family Therapy Group",
        clinician_id: testClinician.id,
        is_active: true,
        available_credit: 0,
      },
    });

    // Create test service
    testService = await prisma.practiceService.create({
      data: {
        id: uuidv4(),
        type: "Individual Therapy",
        rate: 150,
        code: "90834",
        description: "45 minute therapy session",
        duration: 45,
        allow_new_clients: true,
        available_online: true,
        bill_in_units: false,
        block_after: 0,
        block_before: 0,
        is_default: false,
        require_call: false,
      },
    });
  });

  afterEach(async () => {
    // Clean up in reverse order of dependencies
    await prisma.appointment.deleteMany({
      where: { created_by: testUser.id },
    });
    await prisma.practiceService
      .delete({
        where: { id: testService.id },
      })
      .catch(() => {});
    await prisma.clientGroup
      .delete({
        where: { id: testClientGroup.id },
      })
      .catch(() => {});
    await prisma.location
      .delete({
        where: { id: testLocation.id },
      })
      .catch(() => {});
    await prisma.clinician
      .delete({
        where: { id: testClinician.id },
      })
      .catch(() => {});
    await prisma.user
      .delete({
        where: { id: testUser.id },
      })
      .catch(() => {});
  });

  it("should create an appointment with the correct client group name in the title", async () => {
    const appointmentData = {
      type: "APPOINTMENT",
      title: "Appointment with Johnson Family Therapy Group",
      is_all_day: false,
      start_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      end_date: new Date(Date.now() + 90000000).toISOString(), // Tomorrow + 1 hour
      location_id: testLocation.id,
      created_by: testUser.id,
      status: "SCHEDULED",
      client_group_id: testClientGroup.id,
      clinician_id: testClinician.id,
      service_id: testService.id,
      appointment_fee: 150,
    };

    const req = createRequestWithBody("/api/appointment", appointmentData);
    const response = await POST(req);

    expect(response.status).toBe(201);
    const createdAppointment = await response.json();

    // Verify the appointment was created with the correct title
    expect(createdAppointment).toHaveProperty(
      "title",
      "Appointment with Johnson Family Therapy Group",
    );
    expect(createdAppointment).toHaveProperty(
      "client_group_id",
      testClientGroup.id,
    );

    // Verify in database
    const dbAppointment = await prisma.appointment.findUnique({
      where: { id: createdAppointment.id },
      include: { ClientGroup: true },
    });

    expect(dbAppointment).toBeTruthy();
    expect(dbAppointment?.title).toBe(
      "Appointment with Johnson Family Therapy Group",
    );
    expect(dbAppointment?.ClientGroup?.name).toBe(
      "Johnson Family Therapy Group",
    );
  });

  it("should fetch appointment with client group details", async () => {
    // First create an appointment
    const appointment = await prisma.appointment.create({
      data: {
        type: "APPOINTMENT",
        title: "Appointment with Johnson Family Therapy Group",
        is_all_day: false,
        start_date: new Date(Date.now() + 86400000),
        end_date: new Date(Date.now() + 90000000),
        location_id: testLocation.id,
        created_by: testUser.id,
        status: "SCHEDULED",
        client_group_id: testClientGroup.id,
        clinician_id: testClinician.id,
        service_id: testService.id,
        appointment_fee: 150,
      },
    });

    // Fetch the appointment
    const req = createRequest(`/api/appointment?id=${appointment.id}`);
    const response = await GET(req);

    expect(response.status).toBe(200);
    const fetchedAppointment = await response.json();

    expect(fetchedAppointment).toHaveProperty(
      "title",
      "Appointment with Johnson Family Therapy Group",
    );
    expect(fetchedAppointment).toHaveProperty("ClientGroup");
    expect(fetchedAppointment.ClientGroup).toHaveProperty(
      "name",
      "Johnson Family Therapy Group",
    );
  });

  it("should create multiple appointments with different client group names", async () => {
    // Create another client group
    const secondClientGroup = await prisma.clientGroup.create({
      data: {
        id: uuidv4(),
        type: "individual",
        name: "Sarah Thompson Individual Therapy",
        clinician_id: testClinician.id,
        is_active: true,
        available_credit: 0,
      },
    });

    // Create appointments for both groups
    const appointment1Data = {
      type: "APPOINTMENT",
      title: "Appointment with Johnson Family Therapy Group",
      is_all_day: false,
      start_date: new Date(Date.now() + 86400000).toISOString(),
      end_date: new Date(Date.now() + 90000000).toISOString(),
      location_id: testLocation.id,
      created_by: testUser.id,
      status: "SCHEDULED",
      client_group_id: testClientGroup.id,
      clinician_id: testClinician.id,
      service_id: testService.id,
      appointment_fee: 150,
    };

    const appointment2Data = {
      type: "APPOINTMENT",
      title: "Appointment with Sarah Thompson Individual Therapy",
      is_all_day: false,
      start_date: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
      end_date: new Date(Date.now() + 176400000).toISOString(),
      location_id: testLocation.id,
      created_by: testUser.id,
      status: "SCHEDULED",
      client_group_id: secondClientGroup.id,
      clinician_id: testClinician.id,
      service_id: testService.id,
      appointment_fee: 150,
    };

    const response1 = await POST(
      createRequestWithBody("/api/appointment", appointment1Data),
    );
    const response2 = await POST(
      createRequestWithBody("/api/appointment", appointment2Data),
    );

    expect(response1.status).toBe(201);
    expect(response2.status).toBe(201);

    const appt1 = await response1.json();
    const appt2 = await response2.json();

    expect(appt1.title).toBe("Appointment with Johnson Family Therapy Group");
    expect(appt2.title).toBe(
      "Appointment with Sarah Thompson Individual Therapy",
    );

    // Clean up
    await prisma.appointment.delete({ where: { id: appt2.id } });
    await prisma.clientGroup.delete({ where: { id: secondClientGroup.id } });
  });
});
