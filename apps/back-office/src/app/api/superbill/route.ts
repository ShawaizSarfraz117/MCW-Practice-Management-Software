/**
 * Superbill API
 *
 * Updated to handle the new Superbill model with these changes:
 * 1. Superbill no longer has fields like service_code, service_description, etc. directly on it
 * 2. These fields are now fetched from the related Appointment.PracticeService
 * 3. Appointments have a relation to Superbill
 * 4. When creating a Superbill, we link it to multiple Appointments with connect
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { getClinicianInfo } from "@/utils/helpers";
import { logger } from "@mcw/logger";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const clientGroupId = searchParams.get("clientGroupId");
    const format = searchParams.get("format");

    if (id) {
      // Get a specific superbill by ID with related data
      const superbill = await prisma.superbill.findUnique({
        where: { id },
        include: {
          Appointment: {
            include: {
              PracticeService: true,
              Location: true,
            },
          },
        },
      });

      if (!superbill) {
        return NextResponse.json(
          { error: "Superbill not found" },
          { status: 404 },
        );
      }

      // Handle CSV export if requested
      if (format === "csv") {
        // Get data from related models
        const serviceCode =
          superbill.Appointment[0]?.PracticeService?.code || "";
        const serviceDescription =
          superbill.Appointment[0]?.PracticeService?.description || "";
        const units =
          superbill.Appointment[0]?.PracticeService?.bill_in_units &&
          superbill.Appointment[0]?.PracticeService?.duration
            ? Math.ceil(
                (superbill.Appointment[0]?.end_date.getTime() -
                  superbill.Appointment[0]?.start_date.getTime()) /
                  (1000 * 60) /
                  superbill.Appointment[0]?.PracticeService?.duration,
              )
            : 1;
        const pos = "02"; // Default place of service code
        const fees = superbill.Appointment[0]?.appointment_fee || 0;

        const csvData = `Statement #,Date,Service,POS,Description,Units,Fee,Paid
${superbill.superbill_number},${new Date(superbill.issued_date).toLocaleDateString()},${serviceCode},${pos},${serviceDescription},${units},${Number(fees).toFixed(2)},0.00`;

        return new NextResponse(csvData, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="superbill-${superbill.superbill_number}.csv"`,
          },
        });
      }

      // Return the raw superbill data
      return NextResponse.json(superbill);
    } else if (clientGroupId) {
      // Get all superbills for a client group
      const superbills = await prisma.superbill.findMany({
        where: { client_group_id: clientGroupId },
        orderBy: { created_at: "desc" },
        include: {
          Appointment: {
            include: {
              PracticeService: true,
              Location: true,
            },
          },
        },
      });

      // Handle CSV export if requested
      if (format === "csv") {
        let csvData =
          "Statement #,Date,Service,POS,Description,Units,Fee,Paid\n";

        superbills.forEach((superbill) => {
          const serviceCode =
            superbill.Appointment[0]?.PracticeService?.code || "";
          const serviceDescription =
            superbill.Appointment[0]?.PracticeService?.description || "";
          const units =
            superbill.Appointment[0]?.PracticeService?.bill_in_units &&
            superbill.Appointment[0]?.PracticeService?.duration
              ? Math.ceil(
                  (superbill.Appointment[0]?.end_date.getTime() -
                    superbill.Appointment[0]?.start_date.getTime()) /
                    (1000 * 60) /
                    superbill.Appointment[0]?.PracticeService?.duration,
                )
              : 1;
          const pos = "02"; // Default place of service code
          const fees = superbill.Appointment[0]?.appointment_fee || 0;

          csvData += `${superbill.superbill_number},${new Date(superbill.issued_date).toLocaleDateString()},${serviceCode},${pos},${serviceDescription},${units},${Number(fees).toFixed(2)},0.00\n`;
        });

        return new NextResponse(csvData, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="superbills-${clientGroupId}.csv"`,
          },
        });
      }

      // Return the raw superbills data
      return NextResponse.json(superbills);
    } else {
      // Get all superbills (with pagination)
      const page = parseInt(searchParams.get("page") || "1", 10);
      const limit = parseInt(searchParams.get("limit") || "20", 10);
      const skip = (page - 1) * limit;

      const superbills = await prisma.superbill.findMany({
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
        include: {
          ClientGroup: true,
          Appointment: {
            include: {
              PracticeService: true,
              Location: true,
            },
          },
        },
      });

      const totalSuperbills = await prisma.superbill.count();

      return NextResponse.json({
        data: superbills,
        pagination: {
          page,
          limit,
          total: totalSuperbills,
          totalPages: Math.ceil(totalSuperbills / limit),
        },
      });
    }
  } catch (error) {
    logger.error({
      message: "Error fetching superbills",
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        error: "Failed to fetch superbills",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// POST - Generate a new superbill
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { appointment_ids } = data;

    // Validate required parameters
    if (
      !appointment_ids ||
      !Array.isArray(appointment_ids) ||
      appointment_ids.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required parameter: appointment_ids must be a non-empty array",
        },
        { status: 400 },
      );
    }

    // Get appointment details for the first appointment to use for client group info
    const primaryAppointment = await prisma.appointment.findUnique({
      where: { id: appointment_ids[0] },
      include: {
        ClientGroup: {
          include: {
            ClientGroupMembership: {
              include: {
                Client: true,
              },
            },
          },
        },
        Clinician: {
          include: {
            User: true,
          },
        },
        PracticeService: true,
      },
    });

    if (!primaryAppointment) {
      return NextResponse.json(
        { error: "Primary appointment not found" },
        { status: 404 },
      );
    }

    if (!primaryAppointment.client_group_id) {
      return NextResponse.json(
        { error: "Primary appointment has no associated client group" },
        { status: 400 },
      );
    }

    // Verify all appointment ids exist and belong to the same client group
    const appointmentsExist = await prisma.appointment.findMany({
      where: {
        id: { in: appointment_ids },
      },
      select: {
        id: true,
        client_group_id: true,
      },
    });

    if (appointmentsExist.length !== appointment_ids.length) {
      return NextResponse.json(
        { error: "One or more appointments not found" },
        { status: 404 },
      );
    }

    // Verify all appointments belong to the same client group
    const allSameClientGroup = appointmentsExist.every(
      (app) => app.client_group_id === primaryAppointment.client_group_id,
    );

    if (!allSameClientGroup) {
      return NextResponse.json(
        { error: "All appointments must belong to the same client group" },
        { status: 400 },
      );
    }

    // Get current user info
    const { clinicianId } = await getClinicianInfo();

    // Get the current max superbill number
    const maxSuperbill = await prisma.superbill.findFirst({
      orderBy: { superbill_number: "desc" },
    });
    const nextSuperbillNumber = maxSuperbill
      ? maxSuperbill.superbill_number + 1
      : 1;

    // Create client name
    const clientName = primaryAppointment.ClientGroup?.ClientGroupMembership[0]
      ?.Client
      ? `${primaryAppointment.ClientGroup.ClientGroupMembership[0].Client.legal_first_name} ${primaryAppointment.ClientGroup.ClientGroupMembership[0].Client.legal_last_name}`
      : "";

    // Create the superbill
    const createdSuperbill = await prisma.superbill.create({
      data: {
        superbill_number: nextSuperbillNumber,
        client_group_id: primaryAppointment.client_group_id,
        provider_name: primaryAppointment?.Clinician
          ? `${primaryAppointment.Clinician.first_name} ${primaryAppointment.Clinician.last_name}`
          : "",
        provider_email: primaryAppointment?.Clinician?.User
          ? primaryAppointment.Clinician.User.email
          : "",
        client_name: clientName,
        status: "CREATED",
        created_by: clinicianId || null,
        Appointment: {
          connect: appointment_ids.map((id) => ({ id })),
        },
      },
      include: {
        Appointment: {
          include: {
            PracticeService: true,
            Location: true,
          },
        },
      },
    });

    return NextResponse.json(createdSuperbill, { status: 201 });
  } catch (error) {
    logger.error({
      message: "Error creating superbill",
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        error: "Failed to create superbill",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// DELETE - Delete a superbill by ID
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing required parameter: id" },
        { status: 400 },
      );
    }

    // Check if the superbill exists
    const existingSuperbill = await prisma.superbill.findUnique({
      where: { id },
      include: {
        Appointment: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!existingSuperbill) {
      return NextResponse.json(
        { error: "Superbill not found" },
        { status: 404 },
      );
    }

    // First, update all related appointments to set superbill_id to NULL
    if (
      existingSuperbill.Appointment &&
      existingSuperbill.Appointment.length > 0
    ) {
      const appointmentIds = existingSuperbill.Appointment.map((app) => app.id);

      await prisma.appointment.updateMany({
        where: {
          id: {
            in: appointmentIds,
          },
        },
        data: {
          superbill_id: null,
        },
      });
    }

    // Now it's safe to delete the superbill
    await prisma.superbill.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Superbill deleted successfully",
      deletedId: id,
    });
  } catch (error) {
    logger.error({
      message: "Error deleting superbill",
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        error: "Failed to delete superbill",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
