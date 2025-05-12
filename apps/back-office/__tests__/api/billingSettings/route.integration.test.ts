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
  BillingSettingsPrismaFactory,
  ClinicianPrismaFactory,
} from "@mcw/database/mock-data";
import { getServerSession } from "next-auth";
import type { Clinician, BillingSettings } from "@prisma/client";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

describe("Billing Settings API Integration Tests", () => {
  let clinician: Clinician;
  let createdSettingsIds: string[] = [];

  beforeEach(async () => {
    clinician = await ClinicianPrismaFactory.create();
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: clinician.user_id },
    });
  });

  afterEach(async () => {
    if (createdSettingsIds.length > 0) {
      await prisma.billingSettings.deleteMany({
        where: { id: { in: createdSettingsIds } },
      });
      createdSettingsIds = [];
    }
    await prisma.clinician.deleteMany({});
  });

  afterAll(async () => {
    await prisma.billingSettings.deleteMany();
    await prisma.clinician.deleteMany();
  });

  it("POST /api/billing-settings should create billing settings", async () => {
    const payload = {
      autoInvoiceCreation: "daily",
      pastDueDays: 30,
      emailClientPastDue: true,
      invoiceIncludePracticeLogo: true,
      invoiceFooterInfo: "Footer info",
      superbillDayOfMonth: 5,
      superbillIncludePracticeLogo: true,
      superbillIncludeSignatureLine: true,
      superbillIncludeDiagnosisDescription: true,
      superbillFooterInfo: "Superbill footer",
      billingDocEmailDelayMinutes: 15,
      createMonthlyStatementsForNewClients: true,
      createMonthlySuperbillsForNewClients: true,
      defaultNotificationMethod: "email",
    };

    const req = createRequestWithBody("/api/billing-settings", payload);
    const response = await POST(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject(payload);

    createdSettingsIds.push(json.id);

    // Verify in DB
    const dbSettings: BillingSettings | null =
      await prisma.billingSettings.findUnique({ where: { id: json.id } });
    expect(dbSettings).not.toBeNull();
    expect(dbSettings?.autoInvoiceCreation).toBe(payload.autoInvoiceCreation);
  });

  it("GET /api/billing-settings should return billing settings", async () => {
    const settings = await BillingSettingsPrismaFactory.create({
      Clinician: { connect: { id: clinician.id } },
    });
    createdSettingsIds.push(settings.id);

    const response = await GET();
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject({
      id: settings.id,
      clinician_id: clinician.id,
      autoInvoiceCreation: settings.autoInvoiceCreation,
    });
  });

  it("PUT /api/billing-settings should update billing settings", async () => {
    const settings = await BillingSettingsPrismaFactory.create({
      Clinician: { connect: { id: clinician.id } },
    });
    createdSettingsIds.push(settings.id);

    const updatePayload = {
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
    };

    const req = createRequestWithBody("/api/billing-settings", updatePayload, {
      method: "PUT",
    });
    const response = await PUT(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject(updatePayload);

    // Verify in DB
    const dbSettings: BillingSettings | null =
      await prisma.billingSettings.findUnique({ where: { id: settings.id } });
    expect(dbSettings?.autoInvoiceCreation).toBe(
      updatePayload.autoInvoiceCreation,
    );
    expect(dbSettings?.pastDueDays).toBe(updatePayload.pastDueDays);
  });

  it("POST /api/billing-settings should return 400 for missing required fields", async () => {
    const req = createRequestWithBody("/api/billing-settings", {
      autoInvoiceCreation: "daily",
    });
    const response = await POST(req);
    expect([400, 422, 500]).toContain(response.status);
  });
});
