import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { prisma } from "@mcw/database";
import { createRequestWithBody } from "@mcw/utils";
import { POST } from "@/api/good-faith-estimates/route";
import {
  GET,
  PUT,
  DELETE,
} from "@/api/good-faith-estimates/[estimateId]/route";
import { randomUUID } from "crypto";

// Track created entities for cleanup
let createdEntityIds: {
  estimates: string[];
  clients: string[];
  services: string[];
  clinicians: string[];
  locations: string[];
  users: string[];
} = {
  estimates: [],
  clients: [],
  services: [],
  clinicians: [],
  locations: [],
  users: [],
};

describe("Good Faith Estimates API Integration Tests", () => {
  beforeEach(() => {
    // Reset tracking arrays
    createdEntityIds = {
      estimates: [],
      clients: [],
      services: [],
      clinicians: [],
      locations: [],
      users: [],
    };
  });

  afterEach(async () => {
    // Clean up in reverse dependency order
    // Delete GoodFaithServices and GoodFaithClients that belong to tracked estimates
    if (createdEntityIds.estimates.length > 0) {
      await prisma.goodFaithServices.deleteMany({
        where: { good_faith_id: { in: createdEntityIds.estimates } },
      });

      await prisma.goodFaithClients.deleteMany({
        where: { good_faith_id: { in: createdEntityIds.estimates } },
      });

      await prisma.goodFaithEstimate.deleteMany({
        where: { id: { in: createdEntityIds.estimates } },
      });
    }

    // Clean up test data (in real integration tests, these would exist)
    if (createdEntityIds.clinicians.length > 0) {
      await prisma.clinician
        .deleteMany({
          where: { id: { in: createdEntityIds.clinicians } },
        })
        .catch(() => {
          // Ignore errors for test data that may not exist
        });
    }

    if (createdEntityIds.locations.length > 0) {
      await prisma.location
        .deleteMany({
          where: { id: { in: createdEntityIds.locations } },
        })
        .catch(() => {
          // Ignore errors for test data that may not exist
        });
    }

    // Clean up users last
    if (createdEntityIds.users.length > 0) {
      await prisma.user
        .deleteMany({
          where: { id: { in: createdEntityIds.users } },
        })
        .catch(() => {
          // Ignore errors for test data that may not exist
        });
    }

    // Clean up other test entities like PracticeService and Diagnosis
    try {
      await prisma.practiceService.deleteMany({
        where: {
          OR: [{ type: "Therapy Session" }, { code: "90834" }],
        },
      });

      await prisma.diagnosis.deleteMany({
        where: {
          OR: [
            { code: "F32.9" },
            { description: { contains: "Major depressive disorder" } },
          ],
        },
      });

      // Clean up any test clients
      await prisma.client.deleteMany({
        where: {
          OR: [
            { legal_first_name: "Test" },
            { legal_first_name: "Delete Test" },
          ],
        },
      });
    } catch (_error) {
      // Ignore cleanup errors
    }
  });

  describe("POST /api/good-faith-estimates", () => {
    it("should create a new Good Faith Estimate with real database", async () => {
      // Create test user first (required for clinician foreign key)
      const userId = randomUUID();
      const user = await prisma.user.create({
        data: {
          id: userId,
          email: `test.clinician.${userId}@example.com`,
          password_hash: "test_hash",
        },
      });
      createdEntityIds.users.push(user.id);

      // Create test clinician and location first
      const clinician = await prisma.clinician.create({
        data: {
          user_id: user.id,
          address: "123 Test St",
          percentage_split: 0.8,
          first_name: "Dr.",
          last_name: "Integration Test",
        },
      });
      createdEntityIds.clinicians.push(clinician.id);

      const location = await prisma.location.create({
        data: {
          name: "Integration Test Location",
          address: "456 Test Ave",
        },
      });
      createdEntityIds.locations.push(location.id);

      // Create test client
      const client = await prisma.client.create({
        data: {
          legal_first_name: "Test",
          legal_last_name: "Client",
          date_of_birth: new Date("1990-01-01"),
        },
      });

      // Create required PracticeService and Diagnosis records for the test
      const practiceService = await prisma.practiceService.create({
        data: {
          type: "Therapy Session",
          rate: 500.0,
          code: "90834",
          description: "Test therapy session",
          duration: 50,
        },
      });

      const diagnosis = await prisma.diagnosis.create({
        data: {
          code: "F32.9",
          description: "Major depressive disorder, single episode, unspecified",
        },
      });

      const requestData = {
        clinician_id: clinician.id,
        clinician_location_id: location.id,
        total_cost: 50000,
        clients: [
          {
            client_id: client.id,
            name: "Test Client",
            dob: "1990-01-01",
            should_email: true,
          },
        ],
        services: [
          {
            service_id: practiceService.id, // Use actual service ID
            diagnosis_id: diagnosis.id, // Use actual diagnosis ID
            location_id: location.id,
            quantity: 1,
            fee: 50000,
          },
        ],
      };

      const req = createRequestWithBody(
        "/api/good-faith-estimates",
        requestData,
      );
      const response = await POST(req);

      // Debug response if not 201
      if (response.status !== 201) {
        const errorJson = await response.json();
        console.log("API Error Response:", response.status, errorJson);
      }

      expect(response.status).toBe(201);
      const json = await response.json();

      // Track for cleanup
      createdEntityIds.estimates.push(json.id);

      expect(json).toHaveProperty("id");
      expect(json).toHaveProperty("clinician_id", clinician.id);
      expect(json).toHaveProperty("clinician_location_id", location.id);
      expect(json).toHaveProperty("total_cost", 50000);

      // Verify data was actually saved to database
      const savedEstimate = await prisma.goodFaithEstimate.findUnique({
        where: { id: json.id },
        include: {
          GoodFaithClients: true,
          GoodFaithServices: true,
        },
      });

      expect(savedEstimate).toBeTruthy();
      expect(savedEstimate?.GoodFaithClients).toHaveLength(1);
      expect(savedEstimate?.GoodFaithServices).toHaveLength(1);
    });

    it("should enforce foreign key constraints", async () => {
      const requestData = {
        clinician_id: randomUUID(), // Non-existent but valid UUID
        clinician_location_id: randomUUID(), // Non-existent but valid UUID
        total_cost: 50000,
        clients: [
          {
            client_id: "test-client",
            name: "Test Client",
            dob: "1990-01-01",
          },
        ],
        services: [
          {
            service_id: randomUUID(),
            diagnosis_id: randomUUID(),
            location_id: randomUUID(),
            quantity: 1,
            fee: 50000,
          },
        ],
      };

      const req = createRequestWithBody(
        "/api/good-faith-estimates",
        requestData,
      );
      const response = await POST(req);

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json).toHaveProperty("error");
    });
  });

  describe("GET /api/good-faith-estimates/[estimateId]", () => {
    it("should retrieve estimate with all relations", async () => {
      // Create test user first (required for clinician foreign key)
      const userId = randomUUID();
      const user = await prisma.user.create({
        data: {
          id: userId,
          email: `get.test.${userId}@example.com`,
          password_hash: "test_hash",
        },
      });
      createdEntityIds.users.push(user.id);

      // Create test data
      const clinician = await prisma.clinician.create({
        data: {
          user_id: user.id,
          address: "123 Get Test St",
          percentage_split: 0.8,
          first_name: "Dr.",
          last_name: "Get Test",
        },
      });
      createdEntityIds.clinicians.push(clinician.id);

      const location = await prisma.location.create({
        data: {
          name: "Get Test Location",
          address: "456 Get Test Ave",
        },
      });
      createdEntityIds.locations.push(location.id);

      const estimate = await prisma.goodFaithEstimate.create({
        data: {
          clinician_id: clinician.id,
          clinician_location_id: location.id,
          total_cost: 75000,
          notes: "Integration test estimate",
        },
      });
      createdEntityIds.estimates.push(estimate.id);

      const req = createRequestWithBody("/api/good-faith-estimates/test", {});
      const response = await GET(req, { params: { estimateId: estimate.id } });

      expect(response.status).toBe(200);
      const json = await response.json();

      expect(json).toHaveProperty("id", estimate.id);
      expect(json).toHaveProperty("total_cost", 75000);
      expect(json).toHaveProperty("Clinician");
      expect(json).toHaveProperty("Location");
      expect(json.Clinician).toHaveProperty("first_name", "Dr.");
      expect(json.Location).toHaveProperty("name", "Get Test Location");
    });
  });

  describe("PUT /api/good-faith-estimates/[estimateId]", () => {
    it("should update estimate and handle nested relations", async () => {
      // Create test user first (required for clinician foreign key)
      const userId = randomUUID();
      const user = await prisma.user.create({
        data: {
          id: userId,
          email: `update.test.${userId}@example.com`,
          password_hash: "test_hash",
        },
      });
      createdEntityIds.users.push(user.id);

      // Create test data
      const clinician = await prisma.clinician.create({
        data: {
          user_id: user.id,
          address: "123 Update Test St",
          percentage_split: 0.8,
          first_name: "Dr.",
          last_name: "Update Test",
        },
      });
      createdEntityIds.clinicians.push(clinician.id);

      const location = await prisma.location.create({
        data: {
          name: "Update Test Location",
          address: "456 Update Test Ave",
        },
      });
      createdEntityIds.locations.push(location.id);

      const estimate = await prisma.goodFaithEstimate.create({
        data: {
          clinician_id: clinician.id,
          clinician_location_id: location.id,
          total_cost: 60000,
          notes: "Original notes",
        },
      });
      createdEntityIds.estimates.push(estimate.id);

      const updateData = {
        total_cost: 70000,
        notes: "Updated notes via integration test",
      };

      const req = createRequestWithBody(
        "/api/good-faith-estimates/test",
        updateData,
      );
      const response = await PUT(req, { params: { estimateId: estimate.id } });

      expect(response.status).toBe(200);
      const json = await response.json();

      expect(json).toHaveProperty("total_cost", 70000);
      expect(json).toHaveProperty(
        "notes",
        "Updated notes via integration test",
      );

      // Verify database was actually updated
      const updatedEstimate = await prisma.goodFaithEstimate.findUnique({
        where: { id: estimate.id },
      });

      expect(updatedEstimate?.total_cost).toBe(70000);
      expect(updatedEstimate?.notes).toBe("Updated notes via integration test");
    });
  });

  describe("DELETE /api/good-faith-estimates/[estimateId]", () => {
    it("should delete estimate and all related records", async () => {
      // Create test user first (required for clinician foreign key)
      const userId = randomUUID();
      const user = await prisma.user.create({
        data: {
          id: userId,
          email: `delete.test.${userId}@example.com`,
          password_hash: "test_hash",
        },
      });
      createdEntityIds.users.push(user.id);

      // Create test data
      const clinician = await prisma.clinician.create({
        data: {
          user_id: user.id,
          address: "123 Delete Test St",
          percentage_split: 0.8,
          first_name: "Dr.",
          last_name: "Delete Test",
        },
      });
      createdEntityIds.clinicians.push(clinician.id);

      const location = await prisma.location.create({
        data: {
          name: "Delete Test Location",
          address: "456 Delete Test Ave",
        },
      });
      createdEntityIds.locations.push(location.id);

      const client = await prisma.client.create({
        data: {
          legal_first_name: "Delete Test",
          legal_last_name: "Client",
          date_of_birth: new Date("1990-01-01"),
        },
      });

      const estimate = await prisma.goodFaithEstimate.create({
        data: {
          clinician_id: clinician.id,
          clinician_location_id: location.id,
          total_cost: 80000,
          notes: "Will be deleted",
        },
      });

      // Create related records
      const goodFaithClient = await prisma.goodFaithClients.create({
        data: {
          good_faith_id: estimate.id,
          client_id: client.id,
          name: "Delete Test Client",
          dob: new Date("1990-01-01"),
          should_email: false,
        },
      });

      const req = createRequestWithBody("/api/good-faith-estimates/test", {});
      const response = await DELETE(req, {
        params: { estimateId: estimate.id },
      });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toHaveProperty(
        "message",
        "Good Faith Estimate deleted successfully",
      );

      // Verify all records were deleted
      const deletedEstimate = await prisma.goodFaithEstimate.findUnique({
        where: { id: estimate.id },
      });
      expect(deletedEstimate).toBeNull();

      const deletedClient = await prisma.goodFaithClients.findUnique({
        where: { id: goodFaithClient.id },
      });
      expect(deletedClient).toBeNull();

      // Don't track deleted entities for cleanup
    });
  });
});
