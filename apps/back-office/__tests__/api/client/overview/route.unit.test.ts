/* eslint-disable max-lines-per-function */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/api/client/overview/route";
import { createRequest } from "@mcw/utils";
import prismaMock from "@mcw/database/mock";

// Document response type from route
interface ClientDocument {
  id: string;
  documentType: string;
  title: string;
  date: Date;
  status: string;
  clientName: string;
  clientId: string;
  clientGroupId: string;
  clientGroupName: string;
  content?: string;
}

vi.mock("@/utils/helpers", () => ({
  getClinicianInfo: vi
    .fn()
    .mockResolvedValue({ clinicianId: "test-clinician-id" }),
}));

describe("GET /api/client/overview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty results when no documents exist", async () => {
    const request = createRequest("/api/client/overview");

    prismaMock.$queryRawUnsafe.mockResolvedValueOnce([{ total: 0 }]);
    prismaMock.$queryRawUnsafe.mockResolvedValueOnce([]);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual([]);
    expect(data.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    });
  });

  it("should filter by date range", async () => {
    const request = createRequest(
      "/api/client/overview?startDate=2024-01-01&endDate=2024-12-31",
    );

    prismaMock.$queryRawUnsafe.mockResolvedValueOnce([{ total: 1 }]);
    prismaMock.$queryRawUnsafe.mockResolvedValueOnce([
      {
        id: "doc-1",
        documentType: "appointments",
        title: "Therapy Session",
        date: new Date("2024-06-15"),
        status: "SHOW",
        clientName: "John Doe",
        clientId: "client-1",
        clientGroupId: "group-1",
        clientGroupName: "John Doe Individual",
        content: null,
      },
    ]);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].documentType).toBe("appointments");

    // Check that date filter was applied in the query
    const countQuery = prismaMock.$queryRawUnsafe.mock.calls[0][0] as string;
    expect(countQuery).toContain("date >= '2024-01-01");
    expect(countQuery).toContain("date <= '2024-12-31");
  });

  it("should filter by itemType", async () => {
    const request = createRequest(
      "/api/client/overview?itemType=good_faith_estimate",
    );

    prismaMock.$queryRawUnsafe.mockResolvedValueOnce([{ total: 2 }]);
    prismaMock.$queryRawUnsafe.mockResolvedValueOnce([
      {
        id: "gfe-1",
        documentType: "good_faith_estimate",
        title: "Good Faith Estimate",
        date: new Date("2024-06-15"),
        status: "COMPLETED",
        clientName: "Jane Smith",
        clientId: "client-2",
        clientGroupId: "group-2",
        clientGroupName: "Jane Smith Individual",
        content: "5000",
      },
      {
        id: "gfe-2",
        documentType: "good_faith_estimate",
        title: "Good Faith Estimate",
        date: new Date("2024-06-10"),
        status: "COMPLETED",
        clientName: "Bob Johnson",
        clientId: "client-3",
        clientGroupId: "group-3",
        clientGroupName: "Bob Johnson Individual",
        content: "3500",
      },
    ]);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(2);
    expect(
      data.data.every(
        (doc: ClientDocument) => doc.documentType === "good_faith_estimate",
      ),
    ).toBe(true);
  });

  it("should filter by clientGroupId", async () => {
    const request = createRequest(
      "/api/client/overview?clientGroupId=group-123",
    );

    prismaMock.$queryRawUnsafe.mockResolvedValueOnce([{ total: 3 }]);
    prismaMock.$queryRawUnsafe.mockResolvedValueOnce([
      {
        id: "doc-1",
        documentType: "appointments",
        title: "Session 1",
        date: new Date("2024-06-15"),
        status: "SHOW",
        clientName: "John Doe",
        clientId: "client-1",
        clientGroupId: "group-123",
        clientGroupName: "John Doe Individual",
        content: null,
      },
      {
        id: "doc-2",
        documentType: "chart_notes",
        title: "Chart Note",
        date: new Date("2024-06-14"),
        status: "COMPLETED",
        clientName: "John Doe",
        clientId: "client-1",
        clientGroupId: "group-123",
        clientGroupName: "John Doe Individual",
        content: "Session notes here",
      },
      {
        id: "doc-3",
        documentType: "mental_status_exams",
        title: "Mental Status Exam",
        date: new Date("2024-06-10"),
        status: "COMPLETED",
        clientName: "John Doe",
        clientId: "client-1",
        clientGroupId: "group-123",
        clientGroupName: "John Doe Individual",
        content: "{}",
      },
    ]);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(3);
    expect(
      data.data.every(
        (doc: ClientDocument) => doc.clientGroupId === "group-123",
      ),
    ).toBe(true);
  });

  it("should handle pagination", async () => {
    const request = createRequest("/api/client/overview?page=2&limit=10");

    prismaMock.$queryRawUnsafe.mockResolvedValueOnce([{ total: 25 }]);
    prismaMock.$queryRawUnsafe.mockResolvedValueOnce([
      // Mock 10 documents for page 2
      ...Array(10)
        .fill(null)
        .map((_, i) => ({
          id: `doc-${i + 11}`,
          documentType: "appointments",
          title: `Session ${i + 11}`,
          date: new Date(`2024-06-${(i + 11).toString().padStart(2, "0")}`),
          status: "SHOW",
          clientName: "Test Client",
          clientId: "client-1",
          clientGroupId: "group-1",
          clientGroupName: "Test Group",
          content: null,
        })),
    ]);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(10);
    expect(data.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 25,
      totalPages: 3,
    });

    // Check that OFFSET was correctly calculated
    const mainQuery = prismaMock.$queryRawUnsafe.mock.calls[1][0] as string;
    expect(mainQuery).toContain("OFFSET 10 ROWS");
    expect(mainQuery).toContain("FETCH NEXT 10 ROWS ONLY");
  });

  it("should return all document types when itemType is 'all'", async () => {
    const request = createRequest("/api/client/overview?itemType=all");

    prismaMock.$queryRawUnsafe.mockResolvedValueOnce([{ total: 8 }]);
    prismaMock.$queryRawUnsafe.mockResolvedValueOnce([
      {
        id: "1",
        documentType: "appointments",
        title: "Appointment",
        date: new Date(),
        status: "SHOW",
        clientName: "Client 1",
        clientId: "c1",
        clientGroupId: "g1",
        clientGroupName: "Group 1",
        content: null,
      },
      {
        id: "2",
        documentType: "chart_notes",
        title: "Chart Note",
        date: new Date(),
        status: "COMPLETED",
        clientName: "Client 1",
        clientId: "c1",
        clientGroupId: "g1",
        clientGroupName: "Group 1",
        content: "Note",
      },
      {
        id: "3",
        documentType: "diagnosis_and_treatment_plans",
        title: "Treatment Plan",
        date: new Date(),
        status: "SIGNED",
        clientName: "Client 1",
        clientId: "c1",
        clientGroupId: "g1",
        clientGroupName: "Group 1",
        content: null,
      },
      {
        id: "4",
        documentType: "good_faith_estimate",
        title: "GFE",
        date: new Date(),
        status: "COMPLETED",
        clientName: "Client 1",
        clientId: "c1",
        clientGroupId: "g1",
        clientGroupName: "Group 1",
        content: "1000",
      },
      {
        id: "5",
        documentType: "mental_status_exams",
        title: "MSE",
        date: new Date(),
        status: "COMPLETED",
        clientName: "Client 1",
        clientId: "c1",
        clientGroupId: "g1",
        clientGroupName: "Group 1",
        content: "{}",
      },
      {
        id: "6",
        documentType: "scored_measures",
        title: "PHQ-9",
        date: new Date(),
        status: "COMPLETED",
        clientName: "Client 1",
        clientId: "c1",
        clientGroupId: "g1",
        clientGroupName: "Group 1",
        content: "{}",
      },
      {
        id: "7",
        documentType: "questionnaires",
        title: "Intake",
        date: new Date(),
        status: "COMPLETED",
        clientName: "Group 1",
        clientId: "g1",
        clientGroupId: "g1",
        clientGroupName: "Group 1",
        content: "{}",
      },
      {
        id: "8",
        documentType: "other_documents",
        title: "Consent",
        date: new Date(),
        status: "COMPLETED",
        clientName: "Group 1",
        clientId: "g1",
        clientGroupId: "g1",
        clientGroupName: "Group 1",
        content: "{}",
      },
    ]);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(8);

    // Check that all document types are present
    const documentTypes = data.data.map(
      (doc: ClientDocument) => doc.documentType,
    );
    expect(documentTypes).toContain("appointments");
    expect(documentTypes).toContain("chart_notes");
    expect(documentTypes).toContain("diagnosis_and_treatment_plans");
    expect(documentTypes).toContain("good_faith_estimate");
    expect(documentTypes).toContain("mental_status_exams");
    expect(documentTypes).toContain("scored_measures");
    expect(documentTypes).toContain("questionnaires");
    expect(documentTypes).toContain("other_documents");
  });

  it("should apply clinician filter only to appointments", async () => {
    const request = createRequest("/api/client/overview?itemType=appointments");

    prismaMock.$queryRawUnsafe.mockResolvedValueOnce([{ total: 2 }]);
    prismaMock.$queryRawUnsafe.mockResolvedValueOnce([
      {
        id: "apt-1",
        documentType: "appointments",
        title: "Session 1",
        date: new Date("2024-06-15"),
        status: "SHOW",
        clientName: "John Doe Individual",
        clientId: "group-1",
        clientGroupId: "group-1",
        clientGroupName: "John Doe Individual",
        clinicianId: "test-clinician-id",
        content: null,
      },
      {
        id: "apt-2",
        documentType: "appointments",
        title: "Session 2",
        date: new Date("2024-06-16"),
        status: "SHOW",
        clientName: "Jane Doe Individual",
        clientId: "group-2",
        clientGroupId: "group-2",
        clientGroupName: "Jane Doe Individual",
        clinicianId: "test-clinician-id",
        content: null,
      },
    ]);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(2);

    // Check that clinician filter was applied in the query
    const mainQuery = prismaMock.$queryRawUnsafe.mock.calls[1][0] as string;
    expect(mainQuery).toContain("clinicianId");
  });
});
