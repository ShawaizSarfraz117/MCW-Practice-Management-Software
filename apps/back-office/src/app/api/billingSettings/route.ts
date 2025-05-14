import { NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { getServerSession } from "next-auth";
import { backofficeAuthOptions } from "../auth/[...nextauth]/auth-options";
import { Session } from "next-auth";

async function getClinicianId(session: Session | null) {
  if (!session?.user) return null;
  const clinician = await prisma.clinician.findUnique({
    where: { user_id: session.user.id },
    select: { id: true },
  });
  return clinician?.id || null;
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
    const body = await request.json();
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
    const body = await request.json();
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
