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
import { createRequestWithBody } from "@mcw/utils";
import { GET, POST, PUT } from "@/api/billingSettings/route";
import {
  BillingSettingsFactory,
  ClinicianPrismaFactory,
} from "@mcw/database/mock-data";
import { getServerSession } from "next-auth";
import type { Clinician } from "@prisma/client";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

describe("Billing Settings API Integration Tests", () => {
  let clinician: Clinician;

  beforeEach(async () => {
    clinician = await ClinicianPrismaFactory.create();
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: clinician.user_id },
    });
  });

  afterEach(async () => {
    await prisma.billingSettings.deleteMany();
  });

  afterAll(async () => {
    await prisma.billingSettings.deleteMany();
  });

  it("GET /api/billing-settings should return billing settings", async () => {
    const settings = await prisma.billingSettings.create({
      data: {
        clinician_id: clinician.id,
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
      },
    });

    const response = await GET();
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject({
      id: settings.id,
      clinician_id: clinician.id,
      autoInvoiceCreation: settings.autoInvoiceCreation,
      pastDueDays: settings.pastDueDays,
      emailClientPastDue: settings.emailClientPastDue,
      invoiceIncludePracticeLogo: settings.invoiceIncludePracticeLogo,
      invoiceFooterInfo: settings.invoiceFooterInfo,
      superbillDayOfMonth: settings.superbillDayOfMonth,
      superbillIncludePracticeLogo: settings.superbillIncludePracticeLogo,
      superbillIncludeSignatureLine: settings.superbillIncludeSignatureLine,
      superbillIncludeDiagnosisDescription:
        settings.superbillIncludeDiagnosisDescription,
      superbillFooterInfo: settings.superbillFooterInfo,
      billingDocEmailDelayMinutes: settings.billingDocEmailDelayMinutes,
      createMonthlyStatementsForNewClients:
        settings.createMonthlyStatementsForNewClients,
      createMonthlySuperbillsForNewClients:
        settings.createMonthlySuperbillsForNewClients,
      defaultNotificationMethod: settings.defaultNotificationMethod,
    });
  });

  it("GET /api/billing-settings should return 200 with null when no settings exist", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toBeNull();
  });

  it("POST /api/billing-settings should create billing settings", async () => {
    const payload = BillingSettingsFactory.build({
      clinician_id: clinician.id,
    });

    const req = createRequestWithBody("/api/billing-settings", payload);
    const response = await POST(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject({
      autoInvoiceCreation: payload.autoInvoiceCreation,
      pastDueDays: payload.pastDueDays,
      emailClientPastDue: payload.emailClientPastDue,
      invoiceIncludePracticeLogo: payload.invoiceIncludePracticeLogo,
      invoiceFooterInfo: payload.invoiceFooterInfo,
      superbillDayOfMonth: payload.superbillDayOfMonth,
      superbillIncludePracticeLogo: payload.superbillIncludePracticeLogo,
      superbillIncludeSignatureLine: payload.superbillIncludeSignatureLine,
      superbillIncludeDiagnosisDescription:
        payload.superbillIncludeDiagnosisDescription,
      superbillFooterInfo: payload.superbillFooterInfo,
      billingDocEmailDelayMinutes: payload.billingDocEmailDelayMinutes,
      createMonthlyStatementsForNewClients:
        payload.createMonthlyStatementsForNewClients,
      createMonthlySuperbillsForNewClients:
        payload.createMonthlySuperbillsForNewClients,
      defaultNotificationMethod: payload.defaultNotificationMethod,
    });

    // Verify in DB
    const dbSettings = await prisma.billingSettings.findUnique({
      where: { id: json.id },
    });
    expect(dbSettings).not.toBeNull();
    expect(dbSettings?.autoInvoiceCreation).toBe(payload.autoInvoiceCreation);
  });

  it("POST /api/billing-settings should return 500 for invalid payload", async () => {
    const payload = {
      autoInvoiceCreation: "invalid_value",
      pastDueDays: -1,
      superbillDayOfMonth: 32,
      billingDocEmailDelayMinutes: -5,
    };

    const req = createRequestWithBody("/api/billing-settings", payload);
    const response = await POST(req);
    expect(response.status).toBe(500);
  });

  it("PUT /api/billing-settings should update billing settings", async () => {
    // Create settings directly with prisma client
    const settings = await prisma.billingSettings.create({
      data: {
        clinician_id: clinician.id,
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
      },
    });

    const updateData = BillingSettingsFactory.build({
      clinician_id: clinician.id,
      autoInvoiceCreation: "monthly",
      pastDueDays: 45,
      emailClientPastDue: false,
      invoiceIncludePracticeLogo: false,
      invoiceFooterInfo: "Updated footer",
      superbillDayOfMonth: 10,
      superbillIncludePracticeLogo: false,
      superbillIncludeSignatureLine: false,
      superbillIncludeDiagnosisDescription: false,
      superbillFooterInfo: "Updated superbill footer",
      billingDocEmailDelayMinutes: 30,
      createMonthlyStatementsForNewClients: false,
      createMonthlySuperbillsForNewClients: false,
      defaultNotificationMethod: "sms",
    });

    const req = createRequestWithBody("/api/billing-settings", updateData, {
      method: "PUT",
    });
    const response = await PUT(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject({
      id: settings.id,
      autoInvoiceCreation: updateData.autoInvoiceCreation,
      pastDueDays: updateData.pastDueDays,
      emailClientPastDue: updateData.emailClientPastDue,
      invoiceIncludePracticeLogo: updateData.invoiceIncludePracticeLogo,
      invoiceFooterInfo: updateData.invoiceFooterInfo,
      superbillDayOfMonth: updateData.superbillDayOfMonth,
      superbillIncludePracticeLogo: updateData.superbillIncludePracticeLogo,
      superbillIncludeSignatureLine: updateData.superbillIncludeSignatureLine,
      superbillIncludeDiagnosisDescription:
        updateData.superbillIncludeDiagnosisDescription,
      superbillFooterInfo: updateData.superbillFooterInfo,
      billingDocEmailDelayMinutes: updateData.billingDocEmailDelayMinutes,
      createMonthlyStatementsForNewClients:
        updateData.createMonthlyStatementsForNewClients,
      createMonthlySuperbillsForNewClients:
        updateData.createMonthlySuperbillsForNewClients,
      defaultNotificationMethod: updateData.defaultNotificationMethod,
    });

    // Verify in DB
    const dbSettings = await prisma.billingSettings.findUnique({
      where: { id: settings.id },
    });
    expect(dbSettings?.autoInvoiceCreation).toBe(
      updateData.autoInvoiceCreation,
    );
    expect(dbSettings?.pastDueDays).toBe(updateData.pastDueDays);
  });

  it("PUT /api/billing-settings should return 500 when settings don't exist", async () => {
    const updateData = BillingSettingsFactory.build({
      clinician_id: clinician.id,
    });

    const req = createRequestWithBody("/api/billing-settings", updateData, {
      method: "PUT",
    });
    const response = await PUT(req);
    expect(response.status).toBe(500);
  });
});
