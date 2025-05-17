import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { getServerSession } from "next-auth";
import { backofficeAuthOptions } from "../auth/[...nextauth]/auth-options";
import { z } from "zod";
import { logger } from "@mcw/logger";

const clientPortalSettingsSchema = z.object({
  website_domain: z
    .string()
    .min(1, "Website domain is required")
    .regex(
      /^[a-z0-9-]+\.clientsecure\.me$/,
      "Invalid domain format. Must end with .clientsecure.me",
    ),
  allow_appointments: z.boolean().default(true),
  allow_file_uploads: z.boolean().default(true),
  greeting_message: z.string().nullable(),
  allow_new_clients: z.boolean().default(true),
  allow_individual_clients: z.boolean().default(true),
  allow_couple_clients: z.boolean().default(true),
  allow_contact_clients: z.boolean().default(true),
  show_prescreener: z.boolean().default(true),
  ask_payment_method: z.boolean().default(true),
  require_credit_card: z.boolean().default(false),
});

// async function getClinicianId(session: any) {
//   if (!session?.user) return null;
//   const clinician = await prisma.clinician.findUnique({
//     where: { user_id: session.user.id },
//     select: { id: true, first_name: true, last_name: true },
//   });
//   return clinician;
// }

export async function GET() {
  try {
    const session = await getServerSession(backofficeAuthOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clinician = await getClinicianId(session);
    if (!clinician) {
      return NextResponse.json(
        { error: "Clinician not found" },
        { status: 404 },
      );
    }

    // Get or create client portal settings
    let settings = await prisma.clientPortalSettings.findUnique({
      where: { clinician_id: clinician.id },
    });

    if (!settings) {
      // Create default settings if they don't exist
      settings = await prisma.clientPortalSettings.create({
        data: {
          clinician_id: clinician.id,
          website_domain: `${clinician.first_name.toLowerCase()}-${clinician.last_name.toLowerCase()}.clientsecure.me`,
          allow_appointments: true,
          allow_file_uploads: true,
          allow_new_clients: true,
          allow_individual_clients: true,
          allow_couple_clients: true,
          allow_contact_clients: true,
          show_prescreener: true,
          ask_payment_method: true,
          require_credit_card: false,
        },
      });
      logger.info(
        { clinicianId: clinician.id },
        "Created default client portal settings",
      );
    }

    return NextResponse.json(settings);
  } catch (error) {
    logger.error({ error }, "Error fetching client portal settings");
    return NextResponse.json(
      { error: "Failed to fetch client portal settings" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(backofficeAuthOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clinician = await getClinicianId(session);
    if (!clinician) {
      return NextResponse.json(
        { error: "Clinician not found" },
        { status: 404 },
      );
    }

    const data = await request.json();

    // Validate request body
    const validationResult = clientPortalSettingsSchema.safeParse(data);
    if (!validationResult.success) {
      logger.warn(
        { errors: validationResult.error.errors },
        "Invalid client portal settings payload",
      );
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: validationResult.error.errors,
        },
        { status: 422 },
      );
    }

    // Update or create settings
    const settings = await prisma.clientPortalSettings.upsert({
      where: { clinician_id: clinician.id },
      update: validationResult.data,
      create: {
        clinician_id: clinician.id,
        ...validationResult.data,
      },
    });

    logger.info(
      { clinicianId: clinician.id, settingsId: settings.id },
      "Updated client portal settings",
    );

    return NextResponse.json(settings);
  } catch (error) {
    logger.error({ error }, "Error updating client portal settings");
    return NextResponse.json(
      { error: "Failed to update client portal settings" },
      { status: 500 },
    );
  }
}
