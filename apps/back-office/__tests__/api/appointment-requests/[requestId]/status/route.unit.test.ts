import { describe, it, expect, beforeEach, vi } from "vitest";
import { createRequestWithBody } from "@mcw/utils";
import { PUT } from "@/api/appointment-requests/[requestId]/status/route";
import prismaMock from "@mcw/database/mock";

const mockAppointmentRequest = (overrides = {}) => ({
  id: "test-id",
  status: "pending",
  clinician_id: "clinician-1",
  client_id: "client-1",
  service_id: "service-1",
  appointment_for: "web",
  reasons_for_seeking_care: "Reason",
  mental_health_history: "History",
  additional_notes: "Notes",
  start_time: new Date(),
  end_time: new Date(Date.now() + 3600000),
  received_date: new Date(),
  updated_at: new Date(),
  PracticeService: { id: "service-1", location_id: "loc-1" },
  RequestContactItems: [],
  ...overrides,
});

describe("PUT /api/appointment-requests/[requestId]/status", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("successfully updates status for an existing appointment request", async () => {
    const existing = mockAppointmentRequest();
    prismaMock.appointmentRequests.findUnique.mockResolvedValueOnce(existing);
    const updated = { ...existing, status: "accepted" };
    prismaMock.appointmentRequests.update.mockResolvedValueOnce(updated);

    const req = createRequestWithBody(
      "/api/appointment-requests/test-id/status",
      { status: "accepted" },
      { method: "PUT" },
    );
    // Simulate Next.js dynamic route param
    const res = await PUT(req, { params: { requestId: "test-id" } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.status).toBe("accepted");
    expect(json.message).toBe("Status updated successfully");
    expect(prismaMock.appointmentRequests.update).toHaveBeenCalledWith({
      where: { id: "test-id" },
      data: { status: "accepted" },
    });
  });

  it("returns 404 if appointment request does not exist", async () => {
    prismaMock.appointmentRequests.findUnique.mockResolvedValueOnce(null);
    const req = createRequestWithBody(
      "/api/appointment-requests/nonexistent-id/status",
      { status: "accepted" },
      { method: "PUT" },
    );
    const res = await PUT(req, { params: { requestId: "nonexistent-id" } });
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Appointment request not found");
  });

  it("returns 400 for invalid request body (missing status)", async () => {
    const existing = mockAppointmentRequest();
    prismaMock.appointmentRequests.findUnique.mockResolvedValueOnce(existing);
    const req = createRequestWithBody(
      "/api/appointment-requests/test-id/status",
      {},
      { method: "PUT" },
    );
    const res = await PUT(req, { params: { requestId: "test-id" } });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid input");
    expect(json.details).toBeDefined();
  });

  it("returns 400 for invalid request body (invalid status value)", async () => {
    const existing = mockAppointmentRequest();
    prismaMock.appointmentRequests.findUnique.mockResolvedValueOnce(existing);
    const req = createRequestWithBody(
      "/api/appointment-requests/test-id/status",
      { status: "not-a-valid-status" },
      { method: "PUT" },
    );
    const res = await PUT(req, { params: { requestId: "test-id" } });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid input");
    expect(json.details).toBeDefined();
  });

  it("returns 400 for invalid or missing requestId in params", async () => {
    const req = createRequestWithBody(
      "/api/appointment-requests//status",
      { status: "accepted" },
      { method: "PUT" },
    );
    // Simulate missing requestId param
    // @ts-expect-error: Simulate missing param
    const res = await PUT(req, { params: {} });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid or missing requestId");
  });
});
