import { NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { getServerSession } from "next-auth";
import { backofficeAuthOptions } from "../auth/[...nextauth]/auth-options";
import { Session } from "next-auth";

type AutoInvoiceCreation = "daily" | "weekly" | "monthly";
type NotificationMethod = "email" | "sms";

interface BillingSettingsRequest {
  autoInvoiceCreation?: AutoInvoiceCreation;
  pastDueDays?: number;
  emailClientPastDue?: boolean;
  invoiceIncludePracticeLogo?: boolean;
  invoiceFooterInfo?: string;
  superbillDayOfMonth?: number;
  superbillIncludePracticeLogo?: boolean;
  superbillIncludeSignatureLine?: boolean;
  superbillIncludeDiagnosisDescription?: boolean;
  superbillFooterInfo?: string;
  billingDocEmailDelayMinutes?: number;
  createMonthlyStatementsForNewClients?: boolean;
  createMonthlySuperbillsForNewClients?: boolean;
  defaultNotificationMethod?: NotificationMethod;
}

async function getClinicianId(session: Session | null) {
  if (!session?.user) return null;
  const clinician = await prisma.clinician.findUnique({
    where: { user_id: session.user.id },
    select: { id: true },
  });
  return clinician?.id || null;
}

function validateBillingSettings(body: BillingSettingsRequest): string[] {
  const errors: string[] = [];

  // Validate autoInvoiceCreation - TypeScript will catch invalid values at compile time
  if (
    body.autoInvoiceCreation !== undefined &&
    !["daily", "weekly", "monthly"].includes(body.autoInvoiceCreation)
  ) {
    errors.push("autoInvoiceCreation must be one of: daily, weekly, monthly");
  }

  // Validate pastDueDays - check for number type and non-negative value
  if (
    body.pastDueDays !== undefined &&
    (typeof body.pastDueDays !== "number" || body.pastDueDays < 0)
  ) {
    errors.push("pastDueDays must be a non-negative number");
  }

  // Validate superbillDayOfMonth - check for valid day of month
  if (
    body.superbillDayOfMonth !== undefined &&
    (typeof body.superbillDayOfMonth !== "number" ||
      body.superbillDayOfMonth < 1 ||
      body.superbillDayOfMonth > 31)
  ) {
    errors.push("superbillDayOfMonth must be a number between 1 and 31");
  }

  // Validate billingDocEmailDelayMinutes - check for non-negative number
  if (
    body.billingDocEmailDelayMinutes !== undefined &&
    (typeof body.billingDocEmailDelayMinutes !== "number" ||
      body.billingDocEmailDelayMinutes < 0)
  ) {
    errors.push("billingDocEmailDelayMinutes must be a non-negative number");
  }

  // Validate defaultNotificationMethod - TypeScript will catch invalid values at compile time
  if (
    body.defaultNotificationMethod !== undefined &&
    !["email", "sms"].includes(body.defaultNotificationMethod)
  ) {
    errors.push("defaultNotificationMethod must be one of: email, sms");
  }

  return errors;
}

export async function GET() {
  try {
    const session = await getServerSession(backofficeAuthOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const clinicianId = await getClinicianId(session);
    if (!clinicianId) {
      return NextResponse.json(
        { error: "Clinician not found" },
        { status: 401 },
      );
    }
    const billingSettings = await prisma.billingSettings.findUnique({
      where: { clinician_id: clinicianId },
    });
    return NextResponse.json(billingSettings);
  } catch (error) {
    console.error("Error fetching billing settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing settings" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(backofficeAuthOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const clinicianId = await getClinicianId(session);
    if (!clinicianId) {
      return NextResponse.json(
        { error: "Clinician not found" },
        { status: 401 },
      );
    }

    const body: BillingSettingsRequest = await request.json();

    // Validate the request body
    const validationErrors = validateBillingSettings(body);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: "Invalid billing settings", details: validationErrors },
        { status: 500 },
      );
    }

    const billingSettings = await prisma.billingSettings.create({
      data: {
        clinician_id: clinicianId,
        autoInvoiceCreation: body.autoInvoiceCreation,
        pastDueDays: body.pastDueDays,
        emailClientPastDue: body.emailClientPastDue,
        invoiceIncludePracticeLogo: body.invoiceIncludePracticeLogo,
        invoiceFooterInfo: body.invoiceFooterInfo,
        superbillDayOfMonth: body.superbillDayOfMonth,
        superbillIncludePracticeLogo: body.superbillIncludePracticeLogo,
        superbillIncludeSignatureLine: body.superbillIncludeSignatureLine,
        superbillIncludeDiagnosisDescription:
          body.superbillIncludeDiagnosisDescription,
        superbillFooterInfo: body.superbillFooterInfo,
        billingDocEmailDelayMinutes: body.billingDocEmailDelayMinutes,
        createMonthlyStatementsForNewClients:
          body.createMonthlyStatementsForNewClients,
        createMonthlySuperbillsForNewClients:
          body.createMonthlySuperbillsForNewClients,
        defaultNotificationMethod: body.defaultNotificationMethod,
      },
    });
    return NextResponse.json(billingSettings);
  } catch (error) {
    console.error("Error creating billing settings:", error);
    return NextResponse.json(
      { error: "Failed to create billing settings" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(backofficeAuthOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const clinicianId = await getClinicianId(session);
    if (!clinicianId) {
      return NextResponse.json(
        { error: "Clinician not found" },
        { status: 401 },
      );
    }

    const body: BillingSettingsRequest = await request.json();

    // Validate the request body
    const validationErrors = validateBillingSettings(body);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: "Invalid billing settings", details: validationErrors },
        { status: 500 },
      );
    }

    const billingSettings = await prisma.billingSettings.update({
      where: { clinician_id: clinicianId },
      data: {
        autoInvoiceCreation: body.autoInvoiceCreation,
        pastDueDays: body.pastDueDays,
        emailClientPastDue: body.emailClientPastDue,
        invoiceIncludePracticeLogo: body.invoiceIncludePracticeLogo,
        invoiceFooterInfo: body.invoiceFooterInfo,
        superbillDayOfMonth: body.superbillDayOfMonth,
        superbillIncludePracticeLogo: body.superbillIncludePracticeLogo,
        superbillIncludeSignatureLine: body.superbillIncludeSignatureLine,
        superbillIncludeDiagnosisDescription:
          body.superbillIncludeDiagnosisDescription,
        superbillFooterInfo: body.superbillFooterInfo,
        billingDocEmailDelayMinutes: body.billingDocEmailDelayMinutes,
        createMonthlyStatementsForNewClients:
          body.createMonthlyStatementsForNewClients,
        createMonthlySuperbillsForNewClients:
          body.createMonthlySuperbillsForNewClients,
        defaultNotificationMethod: body.defaultNotificationMethod,
      },
    });
    return NextResponse.json(billingSettings);
  } catch (error) {
    console.error("Error updating billing settings:", error);
    return NextResponse.json(
      { error: "Failed to update billing settings" },
      { status: 500 },
    );
  }
}
