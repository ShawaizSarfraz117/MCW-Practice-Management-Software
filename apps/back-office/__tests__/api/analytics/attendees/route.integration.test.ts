/* eslint-disable max-lines-per-function */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/api/analytics/attendees/route";
import { prisma } from "@mcw/database";
import { faker } from "@faker-js/faker";
import type {
  User,
  Clinician,
  Location,
  ClientGroup,
  Client,
  Appointment,
} from "@prisma/client";

// Mock the getClinicianInfo function
vi.mock("@/utils/helpers", () => ({
  getClinicianInfo: vi.fn().mockResolvedValue({
    clinicianId: null, // Don't filter by clinician for simplicity
    isClinician: true,
  }),
}));

describe("GET /api/analytics/attendees - Integration", () => {
  let testUser: User;
  let testClinician: Clinician;
  let testLocation: Location;
  let testClientGroup: ClientGroup;
  let testClient: Client;
  let testAppointment: Appointment;

  beforeEach(async () => {
    // Create test data with unique identifiers
    const uniqueEmail = `test-${faker.string.uuid()}@example.com`;

    testUser = await prisma.user.create({
      data: {
        email: uniqueEmail,
        password_hash: "test-hash",
        date_of_birth: new Date("1990-01-01"),
        phone: faker.phone.number(),
      },
    });

    testClinician = await prisma.clinician.create({
      data: {
        user_id: testUser.id,
        first_name: "Test",
        last_name: "Clinician",
        address: faker.location.streetAddress(),
        percentage_split: 50.0,
        is_active: true,
      },
    });

    testLocation = await prisma.location.create({
      data: {
        name: "Test Location",
        address: faker.location.streetAddress(),
        color: "#FF0000",
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zip: faker.location.zipCode(),
      },
    });

    testClientGroup = await prisma.clientGroup.create({
      data: {
        id: faker.string.uuid(),
        name: "Test Client Group",
        type: "INDIVIDUAL",
        clinician_id: testClinician.id,
        is_active: true,
        available_credit: 0,
      },
    });

    testClient = await prisma.client.create({
      data: {
        legal_first_name: "John",
        legal_last_name: "Doe",
        is_waitlist: false,
        is_active: true,
        date_of_birth: new Date("1985-01-01"),
      },
    });

    await prisma.clientGroupMembership.create({
      data: {
        client_group_id: testClientGroup.id,
        client_id: testClient.id,
        role: "PRIMARY",
        is_contact_only: false,
        is_responsible_for_billing: false,
        is_emergency_contact: false,
      },
    });

    testAppointment = await prisma.appointment.create({
      data: {
        client_group_id: testClientGroup.id,
        clinician_id: testClinician.id,
        location_id: testLocation.id,
        created_by: testUser.id,
        start_date: new Date("2025-05-01T10:00:00Z"),
        end_date: new Date("2025-05-01T11:00:00Z"),
        status: "SHOW",
        type: "INDIVIDUAL",
        title: "Test Appointment",
        is_all_day: false,
      },
    });
  });

  afterEach(async () => {
    // Clean up test data in reverse order of creation
    if (testAppointment?.id) {
      await prisma.appointment.deleteMany({
        where: { id: testAppointment.id },
      });
    }
    if (testClientGroup?.id) {
      await prisma.clientGroupMembership.deleteMany({
        where: { client_group_id: testClientGroup.id },
      });
      await prisma.clientGroup.deleteMany({
        where: { id: testClientGroup.id },
      });
    }
    if (testClient?.id) {
      await prisma.client.deleteMany({
        where: { id: testClient.id },
      });
    }
    if (testClinician?.id) {
      await prisma.clinician.deleteMany({
        where: { id: testClinician.id },
      });
    }
    if (testLocation?.id) {
      await prisma.location.deleteMany({
        where: { id: testLocation.id },
      });
    }
    if (testUser?.id) {
      await prisma.user.deleteMany({
        where: { id: testUser.id },
      });
    }
  });

  it("should fetch attendance data with real database", async () => {
    // Create request
    const url = new URL("http://localhost/api/analytics/attendees");
    url.searchParams.set("startDate", "2025-04-01");
    url.searchParams.set("endDate", "2025-05-31");
    url.searchParams.set("page", "1");
    url.searchParams.set("limit", "20");

    const request = new NextRequest(url);

    // Execute
    const response = await GET(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(200);
    expect(data.data).toBeDefined();
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.pagination).toBeDefined();
    expect(data.pagination.page).toBe(1);
    expect(data.pagination.limit).toBe(20);

    // Check if our test appointment is in the results
    const foundAppointment = data.data.find(
      (item: { id: string }) => item.id === testAppointment.id,
    );
    expect(foundAppointment).toBeDefined();
    expect(foundAppointment.status).toBe("SHOW");
    expect(foundAppointment.type).toBe("INDIVIDUAL");
  });

  it("should filter by status with real database", async () => {
    // Create another appointment with different status
    const noShowAppointment = await prisma.appointment.create({
      data: {
        client_group_id: testClientGroup.id,
        clinician_id: testClinician.id,
        location_id: testLocation.id,
        created_by: testUser.id,
        start_date: new Date("2025-05-02T14:00:00Z"),
        end_date: new Date("2025-05-02T15:00:00Z"),
        status: "NO_SHOW",
        type: "INDIVIDUAL",
        title: "Test No Show Appointment",
        is_all_day: false,
      },
    });

    try {
      // Create request with status filter
      const url = new URL("http://localhost/api/analytics/attendees");
      url.searchParams.set("startDate", "2025-04-01");
      url.searchParams.set("endDate", "2025-05-31");
      url.searchParams.set("status", "SHOW");

      const request = new NextRequest(url);
      const response = await GET(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.data).toBeDefined();

      // Should only return appointments with SHOW status
      const showAppointments = data.data.filter(
        (item: { status: string }) => item.status === "SHOW",
      );
      const noShowAppointments = data.data.filter(
        (item: { status: string }) => item.status === "NO_SHOW",
      );

      expect(showAppointments.length).toBeGreaterThan(0);
      expect(noShowAppointments.length).toBe(0);
    } finally {
      // Clean up the additional appointment
      await prisma.appointment.deleteMany({
        where: { id: noShowAppointment.id },
      });
    }
  });

  it("should filter by client group ID with real database", async () => {
    // Create another client group and appointment
    const anotherClientGroup = await prisma.clientGroup.create({
      data: {
        id: faker.string.uuid(),
        name: "Another Client Group",
        type: "COUPLE",
        clinician_id: testClinician.id,
        is_active: true,
        available_credit: 0,
      },
    });

    const anotherClient = await prisma.client.create({
      data: {
        legal_first_name: "Jane",
        legal_last_name: "Smith",
        is_waitlist: false,
        is_active: true,
        date_of_birth: new Date("1990-01-01"),
      },
    });

    await prisma.clientGroupMembership.create({
      data: {
        client_group_id: anotherClientGroup.id,
        client_id: anotherClient.id,
        role: "PRIMARY",
        is_contact_only: false,
        is_responsible_for_billing: false,
        is_emergency_contact: false,
      },
    });

    const anotherAppointment = await prisma.appointment.create({
      data: {
        client_group_id: anotherClientGroup.id,
        clinician_id: testClinician.id,
        location_id: testLocation.id,
        created_by: testUser.id,
        start_date: new Date("2025-05-03T16:00:00Z"),
        end_date: new Date("2025-05-03T17:00:00Z"),
        status: "SHOW",
        type: "COUPLE",
        title: "Test Couple Appointment",
        is_all_day: false,
      },
    });

    try {
      // Create request with client group filter
      const url = new URL("http://localhost/api/analytics/attendees");
      url.searchParams.set("startDate", "2025-04-01");
      url.searchParams.set("endDate", "2025-05-31");
      url.searchParams.set("clientGroupId", testClientGroup.id);

      const request = new NextRequest(url);
      const response = await GET(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.data).toBeDefined();

      // Should only return appointments for the specified client group
      const filteredAppointments = data.data.filter(
        (item: { client_group_id: string }) =>
          item.client_group_id === testClientGroup.id,
      );
      const otherAppointments = data.data.filter(
        (item: { client_group_id: string }) =>
          item.client_group_id === anotherClientGroup.id,
      );

      expect(filteredAppointments.length).toBeGreaterThan(0);
      expect(otherAppointments.length).toBe(0);
    } finally {
      // Clean up
      await prisma.appointment.deleteMany({
        where: { id: anotherAppointment.id },
      });
      await prisma.clientGroupMembership.deleteMany({
        where: { client_group_id: anotherClientGroup.id },
      });
      await prisma.clientGroup.deleteMany({
        where: { id: anotherClientGroup.id },
      });
      await prisma.client.deleteMany({
        where: { id: anotherClient.id },
      });
    }
  });

  it("should return 400 for missing required parameters", async () => {
    // Test missing start date
    const url1 = new URL("http://localhost/api/analytics/attendees");
    url1.searchParams.set("endDate", "2025-05-31");

    const request1 = new NextRequest(url1);
    const response1 = await GET(request1);
    const data1 = await response1.json();

    expect(response1.status).toBe(400);
    expect(data1.error).toBe("Start date and end date are required");

    // Test missing end date
    const url2 = new URL("http://localhost/api/analytics/attendees");
    url2.searchParams.set("startDate", "2025-05-01");

    const request2 = new NextRequest(url2);
    const response2 = await GET(request2);
    const data2 = await response2.json();

    expect(response2.status).toBe(400);
    expect(data2.error).toBe("Start date and end date are required");
  });
});
