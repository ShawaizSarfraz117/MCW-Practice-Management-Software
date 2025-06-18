import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  afterAll,
  vi,
} from "vitest";
import { prisma } from "@mcw/database";
import { cleanupDatabase } from "@mcw/database/test-utils";
import {
  ClinicianPrismaFactory,
  LocationPrismaFactory,
} from "@mcw/database/mock-data";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { GET, POST, PUT, DELETE } from "@/api/availability/route";

// Mock next-auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));
// Mock auth options
vi.mock("@/api/auth/[...nextauth]/auth-options", () => ({
  backofficeAuthOptions: {},
}));

// Helper function to create an authenticated request with the nextauth.token property
function addAuthToRequest(req: ReturnType<typeof createRequest>) {
  // Add nextauth token property to match what the API routes check for
  return Object.assign(req, {
    nextauth: {
      token: { sub: "test-user-id" },
    },
  });
}

describe("Availability API Integration Tests", () => {
  beforeEach(async () => {
    // Clean up the database before each test to ensure clean state
    await cleanupDatabase(prisma, { verbose: false });
  });

  afterEach(async () => {
    // Clean up after each test
    await cleanupDatabase(prisma, { verbose: false });
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    // Final cleanup
    await cleanupDatabase(prisma, { verbose: false });
  });

  it("GET /api/availability should return all availabilities", async () => {
    const clinician = await ClinicianPrismaFactory.create();
    const location = await LocationPrismaFactory.create();

    const avail1 = await prisma.availability.create({
      data: {
        clinician_id: clinician.id,
        title: "Morning Slot",
        allow_online_requests: false,
        location_id: location.id,
        start_date: new Date(),
        end_date: new Date(Date.now() + 3600000),
        is_recurring: false,
        recurring_rule: null,
      },
    });
    const avail2 = await prisma.availability.create({
      data: {
        clinician_id: clinician.id,
        title: "Afternoon Slot",
        allow_online_requests: true,
        location_id: location.id,
        start_date: new Date(Date.now() + 7200000),
        end_date: new Date(Date.now() + 10800000),
        is_recurring: false,
        recurring_rule: null,
      },
    });

    const req = addAuthToRequest(createRequest("/api/availability"));
    const response = await GET(req);
    expect(response.status).toBe(200);
    const json: import("@mcw/database").Availability[] = await response.json();
    expect(Array.isArray(json)).toBe(true);
    expect(json.length).toBe(2);
    expect(json.find((a) => a.id === avail1.id)).toBeDefined();
    expect(json.find((a) => a.id === avail2.id)).toBeDefined();
  });

  it("GET /api/availability/?id=<id> should return a specific availability", async () => {
    const clinician = await ClinicianPrismaFactory.create();
    const location = await LocationPrismaFactory.create();

    const avail = await prisma.availability.create({
      data: {
        clinician_id: clinician.id,
        title: "Evening Slot",
        allow_online_requests: false,
        location_id: location.id,
        start_date: new Date(),
        end_date: new Date(Date.now() + 3600000),
        is_recurring: false,
        recurring_rule: null,
      },
    });

    const req = addAuthToRequest(
      createRequest(`/api/availability/?id=${avail.id}`),
    );
    const response = await GET(req);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toHaveProperty("id", avail.id);
    expect(json).toHaveProperty("title", avail.title);
    expect(json).toHaveProperty("location_id", location.id);
  });

  it("POST /api/availability should create a new availability", async () => {
    const clinician = await ClinicianPrismaFactory.create();

    const location = await LocationPrismaFactory.create();

    const availData = {
      clinician_id: clinician.id,
      title: "New Slot",
      allow_online_requests: true,
      location_id: location.id,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 3600000).toISOString(),
      is_recurring: false,
      recurring_rule: null,
    };

    const req = addAuthToRequest(
      createRequestWithBody("/api/availability", availData),
    );
    const response = await POST(req);
    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toHaveProperty("id");
    expect(json).toHaveProperty("title", availData.title);
    expect(json).toHaveProperty("clinician_id", clinician.id);
    expect(json).toHaveProperty("location_id", location.id);

    // Verify the availability was actually created in the database
    const createdAvailability = await prisma.availability.findUnique({
      where: { id: json.id },
    });
    expect(createdAvailability).not.toBeNull();
    expect(createdAvailability).toHaveProperty("title", availData.title);
  });

  it("PUT /api/availability should update an existing availability", async () => {
    const clinician = await ClinicianPrismaFactory.create();

    const location = await LocationPrismaFactory.create();

    // Create the availability with proper location_id
    const avail = await prisma.availability.create({
      data: {
        clinician_id: clinician.id,
        title: "Old Slot",
        allow_online_requests: false,
        location_id: location.id,
        start_date: new Date(),
        end_date: new Date(Date.now() + 3600000),
        is_recurring: false,
        recurring_rule: null,
      },
    });

    const updateData = { title: "Updated Slot" };
    const req = addAuthToRequest(
      createRequestWithBody(`/api/availability?id=${avail.id}`, updateData, {
        method: "PUT",
      }),
    );
    const response = await PUT(req);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toHaveProperty("title", "Updated Slot");
  });

  it("DELETE /api/availability/?id=<id> should delete an availability", async () => {
    const clinician = await ClinicianPrismaFactory.create();
    const location = await LocationPrismaFactory.create();

    const avail = await prisma.availability.create({
      data: {
        clinician_id: clinician.id,
        title: "Delete Slot",
        allow_online_requests: false,
        location_id: location.id,
        start_date: new Date(),
        end_date: new Date(Date.now() + 3600000),
        is_recurring: false,
        recurring_rule: null,
      },
    });

    const req = addAuthToRequest(
      createRequest(`/api/availability/?id=${avail.id}`, {
        method: "DELETE",
      }),
    );
    const response = await DELETE(req);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toHaveProperty("success", true);
    // Confirm deletion
    const check = await prisma.availability.findUnique({
      where: { id: avail.id },
    });
    expect(check).toBeNull();
  });

  it("DELETE /api/availability/?id=<id> should return 400 for missing id", async () => {
    const req = addAuthToRequest(
      createRequest(`/api/availability`, { method: "DELETE" }),
    );
    const response = await DELETE(req);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Availability ID is required");
  });
});
