import { describe, it, expect, vi, beforeEach } from "vitest";
import prismaMock from "@mcw/database/mock";
import {
  BillingSettingsFactory,
  ClinicianFactory,
} from "@mcw/database/mock-data";
import { getServerSession } from "next-auth";
import { createRequestWithBody } from "@mcw/utils";
import { GET, POST, PUT } from "@/api/billingSettings/route";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

describe("Billing Settings API Unit Tests", () => {
  const mockSession = {
    user: {
      id: "test-user-id",
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getServerSession).mockResolvedValue(mockSession);
  });

  it("GET /api/billing-settings should return billing settings", async () => {
    const mockClinician = ClinicianFactory.build({
      user_id: mockSession.user.id,
      speciality: null,
      NPI_number: null,
      taxonomy_code: null,
    });
    const mockSettings = BillingSettingsFactory.build({
      clinician_id: mockClinician.id,
    });

    prismaMock.clinician.findUnique.mockResolvedValueOnce(mockClinician);
    prismaMock.billingSettings.findUnique.mockResolvedValueOnce(mockSettings);

    const response = await GET();
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject({
      id: mockSettings.id,
      clinician_id: mockClinician.id,
      autoInvoiceCreation: mockSettings.autoInvoiceCreation,
    });
  });

  it("GET /api/billing-settings should return 401 if not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("POST /api/billing-settings should create billing settings", async () => {
    const mockClinician = ClinicianFactory.build({
      user_id: mockSession.user.id,
      speciality: null,
      NPI_number: null,
      taxonomy_code: null,
    });
    const mockSettings = BillingSettingsFactory.build({
      clinician_id: mockClinician.id,
      autoInvoiceCreation: "daily",
      pastDueDays: 30,
      superbillDayOfMonth: 15,
      billingDocEmailDelayMinutes: 60,
      defaultNotificationMethod: "email",
    });

    prismaMock.clinician.findUnique.mockResolvedValueOnce(mockClinician);
    prismaMock.billingSettings.create.mockResolvedValueOnce(mockSettings);

    const request = createRequestWithBody("/api/billing-settings", {
      autoInvoiceCreation: "daily",
      pastDueDays: 30,
      emailClientPastDue: true,
      invoiceIncludePracticeLogo: true,
      invoiceFooterInfo: "Test footer",
      superbillDayOfMonth: 15,
      superbillIncludePracticeLogo: true,
      superbillIncludeSignatureLine: true,
      superbillIncludeDiagnosisDescription: true,
      superbillFooterInfo: "Test superbill footer",
      billingDocEmailDelayMinutes: 60,
      createMonthlyStatementsForNewClients: true,
      createMonthlySuperbillsForNewClients: true,
      defaultNotificationMethod: "email",
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject({
      id: mockSettings.id,
      clinician_id: mockClinician.id,
      autoInvoiceCreation: mockSettings.autoInvoiceCreation,
    });
  });

  it("PUT /api/billing-settings should update billing settings", async () => {
    const mockClinician = ClinicianFactory.build({
      user_id: mockSession.user.id,
      speciality: null,
      NPI_number: null,
      taxonomy_code: null,
    });
    const mockSettings = BillingSettingsFactory.build({
      clinician_id: mockClinician.id,
      autoInvoiceCreation: "daily",
      pastDueDays: 30,
      superbillDayOfMonth: 15,
      billingDocEmailDelayMinutes: 60,
      defaultNotificationMethod: "email",
    });

    prismaMock.clinician.findUnique.mockResolvedValueOnce(mockClinician);
    prismaMock.billingSettings.upsert.mockResolvedValueOnce(mockSettings);

    const request = createRequestWithBody("/api/billing-settings", {
      autoInvoiceCreation: "daily",
      pastDueDays: 30,
      emailClientPastDue: true,
      invoiceIncludePracticeLogo: true,
      invoiceFooterInfo: "Test footer",
      superbillDayOfMonth: 15,
      superbillIncludePracticeLogo: true,
      superbillIncludeSignatureLine: true,
      superbillIncludeDiagnosisDescription: true,
      superbillFooterInfo: "Test superbill footer",
      billingDocEmailDelayMinutes: 60,
      createMonthlyStatementsForNewClients: true,
      createMonthlySuperbillsForNewClients: true,
      defaultNotificationMethod: "email",
    });

    const response = await PUT(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject({
      id: mockSettings.id,
      clinician_id: mockClinician.id,
      autoInvoiceCreation: mockSettings.autoInvoiceCreation,
    });
  });

  it("should return 401 if session is invalid for POST/PUT", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);

    const request = createRequestWithBody("/api/billing-settings", {});
    let response = await POST(request);
    expect(response.status).toBe(401);

    response = await PUT(request);
    expect(response.status).toBe(401);
  });

  it("should handle database errors", async () => {
    const mockClinician = ClinicianFactory.build({
      user_id: mockSession.user.id,
      speciality: null,
      NPI_number: null,
      taxonomy_code: null,
    });
    prismaMock.clinician.findUnique.mockResolvedValueOnce(mockClinician);
    prismaMock.billingSettings.findUnique.mockRejectedValueOnce(
      new Error("DB error"),
    );

    const response = await GET();
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json).toHaveProperty("error");
  });
});
