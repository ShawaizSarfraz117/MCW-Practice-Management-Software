import { vi } from "vitest";
import { describe, it, expect, beforeEach } from "vitest";
import prismaMock from "@mcw/database/mock";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import {
  GET,
  PUT,
  DELETE,
} from "@/api/good-faith-estimates/[estimateId]/route";

// Mock data factories (KISS principle)
const mockGoodFaithEstimate = (overrides = {}) => ({
  id: "estimate-123",
  clinician_id: "clinician-123",
  clinician_npi: null,
  clinician_tin: null,
  clinician_location_id: "location-123",
  contact_person_id: null,
  clinician_phone: null,
  clinician_email: null,
  provided_date: new Date(),
  expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  service_start_date: null,
  service_end_date: null,
  total_cost: 50000,
  notes: "Test estimate",
  GoodFaithClients: [],
  GoodFaithServices: [],
  Clinician: {
    id: "clinician-123",
    user_id: "user-123",
    first_name: "Dr.",
    last_name: "Test",
    address: "Test Address",
    percentage_split: 0.8,
    is_active: true,
    speciality: null,
    NPI_number: null,
    taxonomy_code: null,
  },
  Location: {
    id: "location-123",
    name: "Test Location",
    address: "Test Address",
    is_active: true,
    city: null,
    color: null,
    state: null,
    street: null,
    zip: null,
  },
  ...overrides,
});

const mockParams = { estimateId: "a1b2c3d4-e5f6-7890-1234-567890abcdef" };

describe("Good Faith Estimates [estimateId] API Unit Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("GET /api/good-faith-estimates/[estimateId]", () => {
    it("should retrieve a Good Faith Estimate successfully", async () => {
      const estimate = mockGoodFaithEstimate();
      prismaMock.goodFaithEstimate.findUnique.mockResolvedValue(estimate);

      const req = createRequest("/api/good-faith-estimates/estimate-123");
      const response = await GET(req, { params: mockParams });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toHaveProperty("id", estimate.id);
      expect(json).toHaveProperty("GoodFaithClients");
      expect(json).toHaveProperty("GoodFaithServices");
      expect(json).toHaveProperty("Clinician");
      expect(json).toHaveProperty("Location");
    });

    it("should return 404 if estimate not found", async () => {
      prismaMock.goodFaithEstimate.findUnique.mockResolvedValue(null);

      const req = createRequest("/api/good-faith-estimates/nonexistent");
      const response = await GET(req, { params: mockParams });

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json).toHaveProperty("error", "Good Faith Estimate not found");
    });

    it("should return 400 for invalid UUID format", async () => {
      const req = createRequest("/api/good-faith-estimates/invalid-uuid");
      const invalidParams = { estimateId: "invalid-uuid" };
      const response = await GET(req, { params: invalidParams });

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty("error", "Invalid estimate ID format");
    });

    it("should handle database errors", async () => {
      prismaMock.goodFaithEstimate.findUnique.mockRejectedValue(
        new Error("Database error"),
      );

      const req = createRequest("/api/good-faith-estimates/estimate-123");
      const response = await GET(req, { params: mockParams });

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json).toHaveProperty("error", "Failed to retrieve estimate");
    });
  });

  describe("PUT /api/good-faith-estimates/[estimateId]", () => {
    it("should update a Good Faith Estimate successfully", async () => {
      const existingEstimate = mockGoodFaithEstimate();
      const updatedEstimate = { ...existingEstimate, notes: "Updated notes" };

      const mockTransaction = vi.fn().mockImplementation(async (callback) => {
        return await callback({
          goodFaithEstimate: {
            findUnique: vi.fn().mockResolvedValue(existingEstimate),
            update: vi.fn().mockResolvedValue(updatedEstimate),
          },
          goodFaithClients: {
            deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
            update: vi.fn().mockResolvedValue({}),
            create: vi.fn().mockResolvedValue({}),
          },
          goodFaithServices: {
            deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
            update: vi.fn().mockResolvedValue({}),
            create: vi.fn().mockResolvedValue({}),
          },
        });
      });

      prismaMock.$transaction.mockImplementation(mockTransaction);
      prismaMock.goodFaithEstimate.findUnique.mockResolvedValue(
        updatedEstimate,
      );

      const updateData = {
        notes: "Updated notes",
        total_cost: 60000,
      };

      const req = createRequestWithBody(
        "/api/good-faith-estimates/estimate-123",
        updateData,
      );
      const response = await PUT(req, { params: mockParams });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toHaveProperty("notes", "Updated notes");
    });

    it("should return 404 if estimate not found", async () => {
      const mockTransaction = vi.fn().mockImplementation(async (callback) => {
        return await callback({
          goodFaithEstimate: {
            findUnique: vi.fn().mockResolvedValue(null),
          },
        });
      });

      prismaMock.$transaction.mockImplementation(mockTransaction);

      const updateData = { notes: "Updated notes" };
      const req = createRequestWithBody(
        "/api/good-faith-estimates/nonexistent",
        updateData,
      );
      const response = await PUT(req, { params: mockParams });

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json).toHaveProperty("error", "Good Faith Estimate not found");
    });

    it("should return 400 for invalid UUID format", async () => {
      const updateData = { notes: "Updated notes" };
      const req = createRequestWithBody(
        "/api/good-faith-estimates/invalid-uuid",
        updateData,
      );
      const invalidParams = { estimateId: "invalid-uuid" };
      const response = await PUT(req, { params: invalidParams });

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty("error", "Invalid estimate ID format");
    });

    it("should handle client updates correctly", async () => {
      const existingEstimate = mockGoodFaithEstimate({
        GoodFaithClients: [{ id: "client-1", name: "John Doe" }],
      });

      const mockTransaction = vi.fn().mockImplementation(async (callback) => {
        return await callback({
          goodFaithEstimate: {
            findUnique: vi.fn().mockResolvedValue(existingEstimate),
            update: vi.fn().mockResolvedValue(existingEstimate),
          },
          goodFaithClients: {
            deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
            update: vi.fn().mockResolvedValue({}),
            create: vi.fn().mockResolvedValue({}),
          },
          goodFaithServices: {
            deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
          },
        });
      });

      prismaMock.$transaction.mockImplementation(mockTransaction);
      prismaMock.goodFaithEstimate.findUnique.mockResolvedValue(
        existingEstimate,
      );

      const updateData = {
        clients: [
          {
            id: "client-1",
            client_id: "client-ref-1",
            name: "John Updated",
            dob: "1990-01-01",
          },
          {
            client_id: "client-ref-2",
            name: "Jane Doe",
            dob: "1985-05-15",
          },
        ],
      };

      const req = createRequestWithBody(
        "/api/good-faith-estimates/estimate-123",
        updateData,
      );
      const response = await PUT(req, { params: mockParams });

      expect(response.status).toBe(200);
    });

    it("should handle database errors", async () => {
      prismaMock.$transaction.mockRejectedValue(new Error("Database error"));

      const updateData = { notes: "Updated notes" };
      const req = createRequestWithBody(
        "/api/good-faith-estimates/estimate-123",
        updateData,
      );
      const response = await PUT(req, { params: mockParams });

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json).toHaveProperty("error", "Failed to update estimate");
    });
  });

  describe("DELETE /api/good-faith-estimates/[estimateId]", () => {
    it("should delete a Good Faith Estimate successfully", async () => {
      const existingEstimate = mockGoodFaithEstimate();

      const mockTransaction = vi.fn().mockImplementation(async (callback) => {
        return await callback({
          goodFaithEstimate: {
            findUnique: vi.fn().mockResolvedValue(existingEstimate),
            delete: vi.fn().mockResolvedValue(existingEstimate),
          },
          goodFaithServices: {
            deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
          goodFaithClients: {
            deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        });
      });

      prismaMock.$transaction.mockImplementation(mockTransaction);

      const req = createRequest("/api/good-faith-estimates/estimate-123");
      const response = await DELETE(req, { params: mockParams });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toHaveProperty(
        "message",
        "Good Faith Estimate deleted successfully",
      );
    });

    it("should return 404 if estimate not found", async () => {
      const mockTransaction = vi.fn().mockImplementation(async (callback) => {
        return await callback({
          goodFaithEstimate: {
            findUnique: vi.fn().mockResolvedValue(null),
          },
        });
      });

      prismaMock.$transaction.mockImplementation(mockTransaction);

      const req = createRequest("/api/good-faith-estimates/nonexistent");
      const response = await DELETE(req, { params: mockParams });

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json).toHaveProperty("error", "Good Faith Estimate not found");
    });

    it("should return 400 for invalid UUID format", async () => {
      const req = createRequest("/api/good-faith-estimates/invalid-uuid");
      const invalidParams = { estimateId: "invalid-uuid" };
      const response = await DELETE(req, { params: invalidParams });

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty("error", "Invalid estimate ID format");
    });

    it("should handle database errors", async () => {
      prismaMock.$transaction.mockRejectedValue(new Error("Database error"));

      const req = createRequest("/api/good-faith-estimates/estimate-123");
      const response = await DELETE(req, { params: mockParams });

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json).toHaveProperty("error", "Failed to delete estimate");
    });
  });
});
