import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@mcw/database";
import { GET, DELETE as _DELETE } from "@/api/appointment-tags/route";
import { POST as createAppointment } from "@/api/appointment/route";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { v4 as uuidv4 } from "uuid";

describe("Appointment Tags API - Integration Tests", () => {
  let testUserId: string;
  let testClinicianId: string;
  let testLocationId: string;
  let testServiceId: string;
  let testClientGroupId: string;
  let testClientId: string;
  let testAppointmentId: string;
  const testTags: Array<{ id: string; name: string }> = [];

  beforeEach(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: `test-tags-${Date.now()}@example.com`,
        password_hash: "hashed_password",
      },
    });
    testUserId = user.id;

    // Create test clinician
    const clinician = await prisma.clinician.create({
      data: {
        id: uuidv4(),
        user_id: testUserId,
        first_name: "Test",
        last_name: "Clinician",
        address: "123 Test St",
        percentage_split: 70,
      },
    });
    testClinicianId = clinician.id;

    // Create test location
    const location = await prisma.location.create({
      data: {
        id: uuidv4(),
        name: "Test Location",
        address: "123 Test St",
      },
    });
    testLocationId = location.id;

    // Create test service
    const service = await prisma.practiceService.create({
      data: {
        id: uuidv4(),
        type: "Individual Therapy",
        rate: 150.0,
        code: "90834",
        duration: 45,
      },
    });
    testServiceId = service.id;

    // Create test client
    const client = await prisma.client.create({
      data: {
        id: uuidv4(),
        legal_first_name: "Test",
        legal_last_name: "Client",
      },
    });
    testClientId = client.id;

    // Create test client group
    const clientGroup = await prisma.clientGroup.create({
      data: {
        id: uuidv4(),
        type: "individual",
        name: "Test Client",
        clinician_id: testClinicianId,
        ClientGroupMembership: {
          create: {
            client_id: client.id,
            role: "PRIMARY",
          },
        },
      },
    });
    testClientGroupId = clientGroup.id;

    // Create test tags
    const tagData = [
      { id: uuidv4(), name: "Appointment Paid", color: "#10b981" },
      { id: uuidv4(), name: "Appointment Unpaid", color: "#ef4444" },
      { id: uuidv4(), name: "New Client", color: "#3b82f6" },
      { id: uuidv4(), name: "No Note", color: "#f59e0b" },
      { id: uuidv4(), name: "Note Added", color: "#22c55e" },
    ];

    for (const tag of tagData) {
      const created = await prisma.tag.create({ data: tag });
      testTags.push(created);
    }

    // Create test appointment
    const appointmentData = {
      type: "appointment",
      title: "Test Appointment",
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      location_id: testLocationId,
      created_by: testUserId,
      client_group_id: testClientGroupId,
      clinician_id: testClinicianId,
      service_id: testServiceId,
      appointment_fee: 150,
    };

    const appointmentRequest = createRequestWithBody(
      "/api/appointment",
      appointmentData,
    );
    const appointmentResponse = await createAppointment(appointmentRequest);
    const appointment = await appointmentResponse.json();
    testAppointmentId = appointment.id;
  });

  afterEach(async () => {
    // Clean up in reverse order of creation
    await prisma.appointmentTag.deleteMany({
      where: { appointment_id: testAppointmentId },
    });
    await prisma.appointment.deleteMany({
      where: { id: testAppointmentId },
    });
    await prisma.clientGroupMembership.deleteMany({
      where: { client_group_id: testClientGroupId },
    });
    await prisma.clientGroup.deleteMany({
      where: { id: testClientGroupId },
    });
    await prisma.client.deleteMany({
      where: { id: testClientId },
    });
    await prisma.practiceService.deleteMany({
      where: { id: testServiceId },
    });
    await prisma.location.deleteMany({
      where: { id: testLocationId },
    });
    await prisma.clinician.deleteMany({
      where: { id: testClinicianId },
    });
    await prisma.user.deleteMany({
      where: { id: testUserId },
    });
    await prisma.tag.deleteMany({
      where: { id: { in: testTags.map((t) => t.id) } },
    });
  });

  describe("GET /api/appointment-tags", () => {
    it("should return all tags", async () => {
      const request = createRequest("/api/appointment-tags");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(5);

      const tagNames = data.map((t: { name: string }) => t.name);
      expect(tagNames).toContain("Appointment Paid");
      expect(tagNames).toContain("Appointment Unpaid");
      expect(tagNames).toContain("New Client");
      expect(tagNames).toContain("No Note");
      expect(tagNames).toContain("Note Added");
    });

    it("should return tags for a specific appointment", async () => {
      const request = createRequest(
        `/api/appointment-tags?appointmentId=${testAppointmentId}`,
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      // Should have default tags (Unpaid, No Note, and possibly New Client)
      expect(data.length).toBeGreaterThanOrEqual(2);

      const tagNames = data.map((at: { Tag: { name: string } }) => at.Tag.name);
      expect(tagNames).toContain("Appointment Unpaid");
      expect(tagNames).toContain("No Note");
    });
  });

  describe("DELETE /api/appointment-tags", () => {
    it("should remove a specific tag from an appointment", async () => {
      // First, get the current tags
      const getRequest = createRequest(
        `/api/appointment-tags?appointmentId=${testAppointmentId}`,
      );
      const getResponse = await GET(getRequest);
      const currentTags = await getResponse.json();

      // Find the "No Note" tag
      const noNoteTag = currentTags.find(
        (at: { Tag: { name: string }; tag_id: string }) =>
          at.Tag.name === "No Note",
      );
      expect(noNoteTag).toBeDefined();

      // Delete the tag
      const deleteRequest = createRequest(
        `/api/appointment-tags?appointmentId=${testAppointmentId}&tagId=${noNoteTag.tag_id}`,
        { method: "DELETE" },
      );
      const deleteResponse = await _DELETE(deleteRequest);
      const deleteData = await deleteResponse.json();

      expect(deleteResponse.status).toBe(200);
      expect(deleteData.message).toBe("Tag removed successfully");

      // Verify the tag was removed
      const verifyRequest = createRequest(
        `/api/appointment-tags?appointmentId=${testAppointmentId}`,
      );
      const verifyResponse = await GET(verifyRequest);
      const remainingTags = await verifyResponse.json();

      const tagNames = remainingTags.map(
        (at: { Tag: { name: string } }) => at.Tag.name,
      );
      expect(tagNames).not.toContain("No Note");
    });
  });

  describe("Default Tags on Appointment Creation", () => {
    it("should automatically add default tags when creating an appointment", async () => {
      // The appointment was created in beforeEach, so let's check its tags
      const request = createRequest(
        `/api/appointment-tags?appointmentId=${testAppointmentId}`,
      );
      const response = await GET(request);
      const data = await response.json();

      const tagNames = data.map((at: { Tag: { name: string } }) => at.Tag.name);

      // Should have Unpaid and No Note tags by default
      expect(tagNames).toContain("Appointment Unpaid");
      expect(tagNames).toContain("No Note");
    });

    it("should add New Client tag for first appointment", async () => {
      // Create a new client group (first appointment)
      const newClient = await prisma.client.create({
        data: {
          id: uuidv4(),
          legal_first_name: "New",
          legal_last_name: "Client",
        },
      });

      const newClientGroup = await prisma.clientGroup.create({
        data: {
          id: uuidv4(),
          type: "individual",
          name: "New Client",
          clinician_id: testClinicianId,
          ClientGroupMembership: {
            create: {
              client_id: newClient.id,
              role: "PRIMARY",
            },
          },
        },
      });

      // Create first appointment for this client
      const appointmentData = {
        type: "appointment",
        title: "First Appointment",
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
        location_id: testLocationId,
        created_by: testUserId,
        client_group_id: newClientGroup.id,
        clinician_id: testClinicianId,
        service_id: testServiceId,
        appointment_fee: 150,
      };

      const appointmentRequest = createRequestWithBody(
        "/api/appointment",
        appointmentData,
      );
      const appointmentResponse = await createAppointment(appointmentRequest);
      const appointment = await appointmentResponse.json();

      // Check tags
      const tagsRequest = createRequest(
        `/api/appointment-tags?appointmentId=${appointment.id}`,
      );
      const tagsResponse = await GET(tagsRequest);
      const tags = await tagsResponse.json();

      const tagNames = tags.map((at: { Tag: { name: string } }) => at.Tag.name);
      expect(tagNames).toContain("New Client");

      // Cleanup
      await prisma.appointmentTag.deleteMany({
        where: { appointment_id: appointment.id },
      });
      await prisma.appointment.deleteMany({
        where: { id: appointment.id },
      });
      await prisma.clientGroupMembership.deleteMany({
        where: { client_group_id: newClientGroup.id },
      });
      await prisma.clientGroup.deleteMany({
        where: { id: newClientGroup.id },
      });
      await prisma.client.deleteMany({
        where: { id: newClient.id },
      });
    });
  });
});
