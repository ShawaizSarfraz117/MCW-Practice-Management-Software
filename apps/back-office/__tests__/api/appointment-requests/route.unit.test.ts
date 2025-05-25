import { describe, it, expect, beforeEach, vi } from "vitest";
import { createRequest } from "@mcw/utils";
import { GET } from "@/api/appointment-requests/route";
import prismaMock from "@mcw/database/mock";

const mockAppointmentRequest = (overrides = {}) => ({
  id: "test-id",
  clinician_id: "clinician-1",
  client_id: "client-1",
  service_id: "service-1",
  appointment_for: "web",
  reasons_for_seeking_care: "Reason",
  mental_health_history: "History",
  additional_notes: "Notes",
  start_time: new Date(),
  end_time: new Date(Date.now() + 3600000),
  status: "pending",
  received_date: new Date(),
  updated_at: new Date(),
  PracticeService: { id: "service-1", location_id: "loc-1" },
  RequestContactItems: [],
  ...overrides,
});

describe("GET /api/appointment-requests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns appointment requests with default pagination", async () => {
    const data = [mockAppointmentRequest()];
    prismaMock.appointmentRequests.findMany.mockResolvedValueOnce(data);
    prismaMock.appointmentRequests.count.mockResolvedValueOnce(1);
    const req = createRequest("/api/appointment-requests");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(1);
    expect(json.pagination.total).toBe(1);
  });

  it("filters by clientStatus", async () => {
    const data = [mockAppointmentRequest({ status: "approved" })];
    prismaMock.appointmentRequests.findMany.mockResolvedValueOnce(data);
    prismaMock.appointmentRequests.count.mockResolvedValueOnce(1);
    const req = createRequest(
      "/api/appointment-requests?clientStatus=approved",
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data[0].status).toBe("approved");
  });

  it("filters by requestSource", async () => {
    const data = [mockAppointmentRequest({ appointment_for: "portal" })];
    prismaMock.appointmentRequests.findMany.mockResolvedValueOnce(data);
    prismaMock.appointmentRequests.count.mockResolvedValueOnce(1);
    const req = createRequest("/api/appointment-requests?requestSource=portal");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data[0].appointment_for).toBe("portal");
  });

  it("filters by searchTerm", async () => {
    const data = [
      mockAppointmentRequest({ reasons_for_seeking_care: "therapy" }),
    ];
    prismaMock.appointmentRequests.findMany.mockResolvedValueOnce(data);
    prismaMock.appointmentRequests.count.mockResolvedValueOnce(1);
    const req = createRequest("/api/appointment-requests?searchTerm=therapy");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data[0].reasons_for_seeking_care).toContain("therapy");
  });

  it("applies pagination and sorting", async () => {
    const data = [mockAppointmentRequest()];
    prismaMock.appointmentRequests.findMany.mockResolvedValueOnce(data);
    prismaMock.appointmentRequests.count.mockResolvedValueOnce(1);
    const req = createRequest(
      "/api/appointment-requests?page=2&limit=1&sortBy=received_date&sortOrder=asc",
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.pagination.page).toBe(2);
    expect(json.pagination.limit).toBe(1);
    expect(json.pagination.totalPages).toBe(1);
  });

  it("filters by expiringSoon", async () => {
    const soon = new Date(Date.now() + 1000 * 60 * 60);
    const data = [mockAppointmentRequest({ end_time: soon })];
    prismaMock.appointmentRequests.findMany.mockResolvedValueOnce(data);
    prismaMock.appointmentRequests.count.mockResolvedValueOnce(1);
    const req = createRequest("/api/appointment-requests?expiringSoon=true");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data[0].end_time).toBeDefined();
  });

  it("returns 400 for invalid query params", async () => {
    const req = createRequest("/api/appointment-requests?sortOrder=invalid");
    const res = await GET(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid query parameters");
  });

  it("returns empty result set", async () => {
    prismaMock.appointmentRequests.findMany.mockResolvedValueOnce([]);
    prismaMock.appointmentRequests.count.mockResolvedValueOnce(0);
    const req = createRequest("/api/appointment-requests?searchTerm=none");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(0);
    expect(json.pagination.total).toBe(0);
  });
});
