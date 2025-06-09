import { vi } from "vitest";
import { describe, it, expect, beforeEach } from "vitest";
import prismaMock from "@mcw/database/mock";
import { createRequestWithBody } from "@mcw/utils";
import { POST } from "@/api/good-faith-estimates/route";

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
  ...overrides,
});

const mockGoodFaithClient = (overrides = {}) => ({
  id: "client-123",
  client_id: "client-ref-123",
  good_faith_id: "estimate-123",
  name: "John Doe",
  dob: new Date("1990-01-01"),
  address: null,
  city: null,
  state: null,
  zip_code: null,
  phone: null,
  email: null,
  should_voice: false,
  should_text: false,
  should_email: true,
  ...overrides,
});

const mockGoodFaithService = (overrides = {}) => ({
  id: "service-123",
  good_faith_id: "estimate-123",
  service_id: "practice-service-123",
  diagnosis_id: "diagnosis-123",
  location_id: "location-123",
  quantity: 1,
  fee: 50000,
  ...overrides,
});

const mockClinician = (overrides = {}) => ({
  id: "clinician-123",
  user_id: "user-123",
  address: "Test Address",
  percentage_split: 0.8,
  is_active: true,
  first_name: "Dr.",
  last_name: "Test",
  speciality: null,
  NPI_number: null,
  taxonomy_code: null,
  ...overrides,
});

const mockLocation = (overrides = {}) => ({
  id: "location-123",
  name: "Test Location",
  address: "Test Address",
  is_active: true,
  city: null,
  color: null,
  state: null,
  street: null,
  zip: null,
  ...overrides,
});

describe("Good Faith Estimates API Unit Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("POST /api/good-faith-estimates", () => {
    it("should create a new Good Faith Estimate successfully", async () => {
      const estimate = mockGoodFaithEstimate();
      const client = mockGoodFaithClient();
      const service = mockGoodFaithService();
      const clinician = mockClinician();
      const location = mockLocation();

      // Mock transaction behavior
      const mockTransaction = vi.fn().mockImplementation(async (callback) => {
        return await callback({
          clinician: {
            findUnique: vi.fn().mockResolvedValue(clinician),
          },
          location: {
            findUnique: vi.fn().mockResolvedValue(location),
          },
          goodFaithEstimate: {
            create: vi.fn().mockResolvedValue(estimate),
          },
          goodFaithClients: {
            create: vi.fn().mockResolvedValue(client),
          },
          goodFaithServices: {
            create: vi.fn().mockResolvedValue(service),
          },
        });
      });

      prismaMock.$transaction.mockImplementation(mockTransaction);
      const completeEstimate = {
        ...estimate,
        GoodFaithClients: [client],
        GoodFaithServices: [service],
        Clinician: clinician,
        Location: location,
      };
      prismaMock.goodFaithEstimate.findUnique.mockResolvedValue(
        completeEstimate,
      );

      const requestData = {
        clinician_id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        clinician_location_id: "b2c3d4e5-f6a7-8901-2345-67890abcdef1",
        total_cost: 50000,
        clients: [
          {
            client_id: "client-ref-123",
            name: "John Doe",
            dob: "1990-01-01",
          },
        ],
        services: [
          {
            service_id: "practice-service-123",
            diagnosis_id: "diagnosis-123",
            location_id: "c3d4e5f6-a7b8-9012-3456-7890abcdef12",
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

      // Debug: log the response to see what's happening
      if (response.status !== 201) {
        const json = await response.json();
        console.log("Unexpected response:", response.status, json);
      }

      expect(response.status).toBe(201);
      const json = await response.json();
      expect(json).toHaveProperty("id", estimate.id);
      expect(json).toHaveProperty("GoodFaithClients");
      expect(json).toHaveProperty("GoodFaithServices");
    });

    it("should return 400 if required fields are missing", async () => {
      const requestData = {
        clinician_id: "clinician-123",
        // Missing clinician_location_id
        total_cost: 50000,
      };

      const req = createRequestWithBody(
        "/api/good-faith-estimates",
        requestData,
      );
      const response = await POST(req);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty("error");
      expect(json.error).toContain("clinician_location_id is required");
    });

    it("should return 400 for invalid UUID format", async () => {
      const requestData = {
        clinician_id: "invalid-uuid",
        clinician_location_id: "location-123",
        total_cost: 50000,
        clients: [
          {
            client_id: "client-ref-123",
            name: "John Doe",
            dob: "1990-01-01",
          },
        ],
        services: [
          {
            service_id: "practice-service-123",
            diagnosis_id: "diagnosis-123",
            location_id: "location-123",
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

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty("error", "Invalid UUID format");
    });

    it("should return 400 if clients array is empty", async () => {
      const requestData = {
        clinician_id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        clinician_location_id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        total_cost: 50000,
        clients: [],
        services: [
          {
            service_id: "practice-service-123",
            diagnosis_id: "diagnosis-123",
            location_id: "location-123",
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

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty("error", "At least one client is required");
    });

    it("should return 400 if services array is empty", async () => {
      const requestData = {
        clinician_id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        clinician_location_id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        total_cost: 50000,
        clients: [
          {
            client_id: "client-ref-123",
            name: "John Doe",
            dob: "1990-01-01",
          },
        ],
        services: [],
      };

      const req = createRequestWithBody(
        "/api/good-faith-estimates",
        requestData,
      );
      const response = await POST(req);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty("error", "At least one service is required");
    });

    it("should return 404 if clinician not found", async () => {
      const mockTransaction = vi.fn().mockImplementation(async (callback) => {
        return await callback({
          clinician: {
            findUnique: vi.fn().mockResolvedValue(null),
          },
          location: {
            findUnique: vi.fn().mockResolvedValue(mockLocation()),
          },
        });
      });

      prismaMock.$transaction.mockImplementation(mockTransaction);

      const requestData = {
        clinician_id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        clinician_location_id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        total_cost: 50000,
        clients: [
          {
            client_id: "client-ref-123",
            name: "John Doe",
            dob: "1990-01-01",
          },
        ],
        services: [
          {
            service_id: "practice-service-123",
            diagnosis_id: "diagnosis-123",
            location_id: "location-123",
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
      expect(json).toHaveProperty("error", "Clinician not found");
    });

    it("should return 404 if location not found", async () => {
      const mockTransaction = vi.fn().mockImplementation(async (callback) => {
        return await callback({
          clinician: {
            findUnique: vi.fn().mockResolvedValue(mockClinician()),
          },
          location: {
            findUnique: vi.fn().mockResolvedValue(null),
          },
        });
      });

      prismaMock.$transaction.mockImplementation(mockTransaction);

      const requestData = {
        clinician_id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        clinician_location_id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        total_cost: 50000,
        clients: [
          {
            client_id: "client-ref-123",
            name: "John Doe",
            dob: "1990-01-01",
          },
        ],
        services: [
          {
            service_id: "practice-service-123",
            diagnosis_id: "diagnosis-123",
            location_id: "location-123",
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
      expect(json).toHaveProperty("error", "Location not found");
    });

    it("should handle database errors", async () => {
      prismaMock.$transaction.mockRejectedValue(
        new Error("Database connection failed"),
      );

      const requestData = {
        clinician_id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        clinician_location_id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        total_cost: 50000,
        clients: [
          {
            client_id: "client-ref-123",
            name: "John Doe",
            dob: "1990-01-01",
          },
        ],
        services: [
          {
            service_id: "practice-service-123",
            diagnosis_id: "diagnosis-123",
            location_id: "location-123",
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

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json).toHaveProperty("error");
    });
  });
});
