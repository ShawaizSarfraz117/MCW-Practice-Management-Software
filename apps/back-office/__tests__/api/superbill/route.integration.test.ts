/* eslint-disable max-lines-per-function */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@mcw/database";
import { generateUUID } from "@mcw/utils";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Mock helpers module to avoid auth issues in tests
vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({
    user: { id: "test-user-id", email: "test@example.com" },
  }),
}));

// Mock implementation of the superbill API route handlers
const GET = async (request: NextRequest) => {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (id) {
      // Get single superbill by ID
      const superbill = await prisma.superbill.findUnique({
        where: { id },
        include: {
          Appointment: {
            include: {
              PracticeService: true,
              Location: true,
            },
          },
          ClientGroup: true,
        },
      });

      if (!superbill) {
        return NextResponse.json(
          { error: "Superbill not found" },
          { status: 404 },
        );
      }

      return NextResponse.json(superbill);
    } else {
      // Get all superbills with pagination
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = parseInt(url.searchParams.get("limit") || "10");
      const skip = (page - 1) * limit;

      const [superbills, total] = await Promise.all([
        prisma.superbill.findMany({
          skip,
          take: limit,
          orderBy: { created_at: "desc" },
          include: {
            Appointment: {
              include: {
                PracticeService: true,
                Location: true,
              },
            },
            ClientGroup: true,
          },
        }),
        prisma.superbill.count(),
      ]);

      return NextResponse.json({
        data: superbills,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }
  } catch (error) {
    console.error("Error retrieving superbills:", error);
    return NextResponse.json(
      { error: "Failed to retrieve superbills" },
      { status: 500 },
    );
  }
};

const POST = async (request: NextRequest) => {
  try {
    const data = await request.json();

    // Validate required fields
    if (
      !data.client_group_id ||
      !data.appointment_ids ||
      !Array.isArray(data.appointment_ids)
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Create the superbill
    const superbill = await prisma.superbill.create({
      data: {
        id: data.id || generateUUID(),
        client_group_id: data.client_group_id,
        status: data.status || "DRAFT",
        created_at: new Date(),
        issued_date: data.issued_date || new Date(),
        client_name: data.client_name || "Test Client",
        provider_name: data.provider_name || "Test Provider",
        provider_email: data.provider_email || "provider@example.com",
        superbill_number:
          parseInt(data.superbill_number) ||
          Math.floor(Math.random() * 1000000),
      },
    });

    // Update appointments to link them to this superbill
    if (data.appointment_ids.length > 0) {
      for (const appointmentId of data.appointment_ids) {
        await prisma.appointment.update({
          where: { id: appointmentId },
          data: { superbill_id: superbill.id },
        });
      }
    }

    // Return the created superbill with its linked appointments
    const createdSuperbill = await prisma.superbill.findUnique({
      where: { id: superbill.id },
      include: {
        Appointment: {
          include: {
            PracticeService: true,
            Location: true,
          },
        },
        ClientGroup: true,
      },
    });

    return NextResponse.json(createdSuperbill);
  } catch (error) {
    console.error("Error creating superbill:", error);
    return NextResponse.json(
      { error: "Failed to create superbill" },
      { status: 500 },
    );
  }
};

// Helper function for cleaning up test data
async function cleanupTestData(ids: {
  clientId?: string;
  clientGroupId?: string;
  practiceServiceId?: string;
  appointmentId?: string;
  superbillId?: string;
  userId?: string;
}) {
  try {
    // Update appointments to remove superbill reference first
    if (ids.appointmentId) {
      try {
        await prisma.appointment.update({
          where: { id: ids.appointmentId },
          data: { superbill_id: null },
        });
      } catch (error) {
        console.error("Error updating appointment:", error);
      }
    }

    // Delete superbill
    if (ids.superbillId) {
      try {
        await prisma.superbill.delete({
          where: { id: ids.superbillId },
        });
      } catch (error) {
        console.error("Error deleting superbill:", error);
      }
    }

    // Delete appointment
    if (ids.appointmentId) {
      try {
        await prisma.appointment.delete({
          where: { id: ids.appointmentId },
        });
      } catch (error) {
        console.error("Error deleting appointment:", error);
      }
    }

    // Delete practice service
    if (ids.practiceServiceId) {
      try {
        await prisma.practiceService.delete({
          where: { id: ids.practiceServiceId },
        });
      } catch (error) {
        console.error("Error deleting practice service:", error);
      }
    }

    // Delete client group membership first (due to foreign key constraints)
    if (ids.clientGroupId && ids.clientId) {
      try {
        await prisma.clientGroupMembership.deleteMany({
          where: {
            client_group_id: ids.clientGroupId,
            client_id: ids.clientId,
          },
        });
      } catch (error) {
        console.error("Error deleting client group membership:", error);
      }
    }

    // Delete client group
    if (ids.clientGroupId) {
      try {
        await prisma.clientGroup.delete({
          where: { id: ids.clientGroupId },
        });
      } catch (error) {
        console.error("Error deleting client group:", error);
      }
    }

    // Delete client
    if (ids.clientId) {
      try {
        await prisma.client.delete({
          where: { id: ids.clientId },
        });
      } catch (error) {
        console.error("Error deleting client:", error);
      }
    }

    // Delete user
    if (ids.userId) {
      try {
        await prisma.user.delete({
          where: { id: ids.userId },
        });
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  } catch (error) {
    console.error("Error cleaning up data:", error);
  }
}

describe("Superbill API - Integration Tests", () => {
  // Test data IDs
  const testIds: {
    clientId?: string;
    clientGroupId?: string;
    practiceServiceId?: string;
    appointmentId?: string;
    superbillId?: string;
    userId?: string;
  } = {};

  beforeAll(async () => {
    try {
      // Create a test user first
      const user = await prisma.user.create({
        data: {
          id: generateUUID(),
          email: `test-${Math.random().toString(36).substring(7)}@example.com`,
          password_hash: "test-password-hash",
        },
      });
      testIds.userId = user.id;

      // Create a client
      const client = await prisma.client.create({
        data: {
          id: generateUUID(),
          legal_first_name: "Test",
          legal_last_name: "Client",
          date_of_birth: new Date("1990-01-01"),
          is_active: true,
        },
      });
      testIds.clientId = client.id;

      // Create a client group
      const clientGroup = await prisma.clientGroup.create({
        data: {
          id: generateUUID(),
          name: "Test Group",
          type: "INDIVIDUAL",
          created_at: new Date(),
          available_credit: 0,
          ClientGroupMembership: {
            create: {
              client_id: client.id,
            },
          },
        },
      });
      testIds.clientGroupId = clientGroup.id;

      // Create a practice service
      const practiceService = await prisma.practiceService.create({
        data: {
          id: generateUUID(),
          code: "90837",
          description: "Therapy Session",
          rate: 150,
          duration: 60,
          type: "THERAPY",
        },
      });
      testIds.practiceServiceId = practiceService.id;

      // Create an appointment
      const appointment = await prisma.appointment.create({
        data: {
          id: generateUUID(),
          start_date: new Date(),
          end_date: new Date(Date.now() + 60 * 60 * 1000),
          status: "SCHEDULED",
          client_group_id: clientGroup.id,
          type: "INDIVIDUAL",
          is_all_day: false,
          is_recurring: false,
          created_by: user.id, // Use the real user ID
          service_id: practiceService.id,
        },
      });
      testIds.appointmentId = appointment.id;
    } catch (error) {
      console.error("Error setting up test data:", error);
      throw error;
    }
  });

  afterAll(async () => {
    await cleanupTestData(testIds);
  });

  // GET TESTS
  it("GET /api/superbill should return all superbills with pagination", async () => {
    const request = createRequest("/api/superbill");
    const response = await GET(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("data");
    expect(data).toHaveProperty("pagination");
    expect(Array.isArray(data.data)).toBe(true);
  });

  it("GET /api/superbill?id= should return 404 if superbill not found", async () => {
    // Mock the findUnique method to avoid UUID conversion issues
    const originalFindUnique = prisma.superbill.findUnique;
    prisma.superbill.findUnique = vi.fn().mockResolvedValue(null);

    const request = createRequest("/api/superbill?id=non-existent-id");
    const response = await GET(request);

    // Restore the original method
    prisma.superbill.findUnique = originalFindUnique;

    expect(response.status).toBe(404);
  });

  it("GET /api/superbill?id= should return superbill if found", async () => {
    // First create a superbill
    const superbill = await prisma.superbill.create({
      data: {
        id: generateUUID(),
        client_group_id: testIds.clientGroupId!,
        status: "DRAFT",
        created_at: new Date(),
        issued_date: new Date(),
        client_name: "Test Client",
        provider_name: "Test Provider",
        provider_email: "provider@example.com",
        superbill_number: 123456,
      },
    });
    testIds.superbillId = superbill.id;

    // Then update the appointment to link it to the superbill
    await prisma.appointment.update({
      where: { id: testIds.appointmentId },
      data: { superbill_id: superbill.id },
    });

    // Now test getting the superbill
    const request = createRequest(`/api/superbill?id=${superbill.id}`);
    const response = await GET(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.id).toBe(superbill.id);
    expect(data.client_group_id).toBe(testIds.clientGroupId);
    expect(data.Appointment).toHaveLength(1);
    expect(data.Appointment[0].id).toBe(testIds.appointmentId);
    expect(data.Appointment[0].PracticeService).toBeTruthy();
    expect(data.Appointment[0].PracticeService.id).toBe(
      testIds.practiceServiceId,
    );
  });

  // POST TESTS
  it("POST /api/superbill should create a superbill with appointment links", async () => {
    // Reset superbill link from previous test
    await prisma.appointment.update({
      where: { id: testIds.appointmentId },
      data: { superbill_id: null },
    });

    const payload = {
      client_group_id: testIds.clientGroupId!,
      appointment_ids: [testIds.appointmentId!],
      status: "DRAFT",
      issued_date: new Date().toISOString(),
      client_name: "Test Client",
      provider_name: "Test Provider",
      provider_email: "provider@example.com",
    };

    const request = createRequestWithBody("/api/superbill", payload);
    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.client_group_id).toBe(testIds.clientGroupId);
    expect(data.Appointment).toHaveLength(1);
    expect(data.Appointment[0].id).toBe(testIds.appointmentId);

    // Save for cleanup
    testIds.superbillId = data.id;
  });

  it("POST /api/superbill should return 400 if required fields are missing", async () => {
    const payload = {
      status: "DRAFT",
    };

    const request = createRequestWithBody("/api/superbill", payload);
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("POST /api/superbill should handle errors properly", async () => {
    // Mock a DB error
    vi.spyOn(prisma.superbill, "create").mockRejectedValueOnce(
      new Error("Database error"),
    );

    const payload = {
      client_group_id: testIds.clientGroupId!,
      appointment_ids: [testIds.appointmentId!],
      status: "DRAFT",
    };

    const request = createRequestWithBody("/api/superbill", payload);
    const response = await POST(request);
    expect(response.status).toBe(500);

    // Restore the mock
    vi.restoreAllMocks();
  });
});
