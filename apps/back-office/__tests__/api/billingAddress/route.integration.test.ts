import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from "vitest";
import { GET, POST } from "@/api/billingAddress/route";
import { prisma } from "@mcw/database";
import { getClinicianInfo } from "@/utils/helpers";
import { createRequestWithBody } from "@mcw/utils";
import { faker } from "@faker-js/faker";

// Create mock user and clinician data
const mockUser = {
  id: faker.string.uuid(),
  email: faker.internet.email(),
  password_hash: "mock-hash",
  last_login: new Date(),
  date_of_birth: new Date(),
  phone: faker.phone.number(),
  profile_photo: faker.image.url(),
};

const mockClinician = {
  id: faker.string.uuid(),
  user_id: mockUser.id,
  first_name: "Test",
  last_name: "Clinician",
  address: "123 Test St",
  percentage_split: 100,
};

// Mock helpers
vi.mock("@/utils/helpers");

describe("BillingAddress API Integration Tests", () => {
  beforeAll(async () => {
    // Create test user and clinician in database
    await prisma.user.create({
      data: mockUser,
    });
    await prisma.clinician.create({
      data: mockClinician,
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.billingAddress.deleteMany();
    await prisma.clinician.deleteMany({
      where: { id: mockClinician.id },
    });
    await prisma.user.deleteMany({
      where: { id: mockUser.id },
    });
  });

  beforeEach(async () => {
    // Reset mocks
    vi.resetAllMocks();
    vi.mocked(getClinicianInfo).mockResolvedValue({
      isClinician: true,
      clinicianId: mockClinician.id,
    });

    // Clean up any existing billing addresses
    await prisma.billingAddress.deleteMany();
  });

  describe("GET /api/billingAddress", () => {
    it("should return empty array when no billing addresses exist", async () => {
      const request = createRequestWithBody("/api/billingAddress", {});
      const response = await GET(request);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ billingAddresses: [] });
    });

    it("should return 403 when user is not a clinician", async () => {
      vi.mocked(getClinicianInfo).mockResolvedValueOnce({
        isClinician: false,
        clinicianId: null,
      });

      const request = createRequestWithBody("/api/billingAddress", {});
      const response = await GET(request);
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({
        error: "User is not a clinician",
      });
    });

    it("should return billing addresses when they exist", async () => {
      const businessAddress = {
        street: "123 Business St",
        city: "Business City",
        state: "BC",
        zip: "12345",
        type: "business",
        clinician_id: mockClinician.id,
      };

      const clientAddress = {
        street: "456 Client Ave",
        city: "Client City",
        state: "CC",
        zip: "67890",
        type: "client",
        clinician_id: mockClinician.id,
      };

      await prisma.billingAddress.createMany({
        data: [businessAddress, clientAddress],
      });

      const request = createRequestWithBody("/api/billingAddress", {});
      const response = await GET(request);
      expect(response.status).toBe(200);

      const { billingAddresses } = await response.json();
      expect(billingAddresses).toHaveLength(2);
      expect(billingAddresses).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            street: businessAddress.street,
            city: businessAddress.city,
            state: businessAddress.state,
            zip: businessAddress.zip,
            type: businessAddress.type,
          }),
          expect.objectContaining({
            street: clientAddress.street,
            city: clientAddress.city,
            state: clientAddress.state,
            zip: clientAddress.zip,
            type: clientAddress.type,
          }),
        ]),
      );
    });
  });

  describe("POST /api/billingAddress", () => {
    const validData = {
      street: "789 New St",
      city: "New City",
      state: "NC",
      zip: "12345",
      type: "business",
    };

    it("should return 403 when user is not a clinician", async () => {
      vi.mocked(getClinicianInfo).mockResolvedValueOnce({
        isClinician: false,
        clinicianId: null,
      });

      const request = createRequestWithBody("/api/billingAddress", validData);
      const response = await POST(request);
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({
        error: "User is not a clinician",
      });
    });

    it("should create new billing address", async () => {
      const request = createRequestWithBody("/api/billingAddress", validData);
      const response = await POST(request);
      expect(response.status).toBe(201);

      const { billingAddress } = await response.json();
      expect(billingAddress).toMatchObject({
        ...validData,
        clinician_id: mockClinician.id,
      });

      // Verify in database
      const dbRecord = await prisma.billingAddress.findFirst({
        where: { id: billingAddress.id },
      });
      expect(dbRecord).toBeTruthy();
      expect(dbRecord).toMatchObject({
        ...validData,
        clinician_id: mockClinician.id,
      });
    });

    it("should update existing billing address of same type", async () => {
      // First create initial address
      const existingAddress = await prisma.billingAddress.create({
        data: {
          street: "Initial St",
          city: "Initial City",
          state: "IC",
          zip: "11111",
          type: "business",
          clinician_id: mockClinician.id,
        },
      });

      // Try to create another business address
      const request = createRequestWithBody("/api/billingAddress", validData);
      const response = await POST(request);
      expect(response.status).toBe(200);

      const { billingAddress, message } = await response.json();
      expect(message).toBe("Existing business billing address was updated");
      expect(billingAddress.id).toBe(existingAddress.id);
      expect(billingAddress).toMatchObject({
        ...validData,
        clinician_id: mockClinician.id,
      });
    });

    it("should validate input data", async () => {
      const invalidData = {
        street: "", // Empty street
        city: "", // Empty city
        state: "", // Empty state
        zip: "123", // Invalid ZIP
        type: "invalid", // Invalid type
      };

      const request = createRequestWithBody("/api/billingAddress", invalidData);
      const response = await POST(request);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        error: "Invalid data",
        details: expect.any(Array),
      });

      // Verify nothing was created in database
      const dbRecord = await prisma.billingAddress.findFirst();
      expect(dbRecord).toBeNull();
    });
  });
});
