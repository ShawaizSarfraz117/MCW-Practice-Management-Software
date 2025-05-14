import { NextRequest, NextResponse } from "next/server";
import { prisma, Prisma } from "@mcw/database";
import { getClinicianInfo } from "@/utils/helpers";
import { logger } from "@mcw/logger";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const clientGroupId = searchParams.get("clientGroupId");
    const format = searchParams.get("format");

    if (id) {
      // Get a specific superbill by ID
      const superbill = await prisma.superbill.findUnique({
        where: { id },
      });

      if (!superbill) {
        return NextResponse.json(
          { error: "Superbill not found" },
          { status: 404 },
        );
      }

      // Handle CSV export if requested
      if (format === "csv") {
        const csvData = `Statement #,Date,Service,DX,Description,Units,Fee,Paid
${superbill.superbill_number},${new Date(superbill.issued_date).toLocaleDateString()},${superbill.service_code || ""},${superbill.diagnosis_code || ""},${superbill.service_description || ""},${superbill.units},${Number(superbill.amount).toFixed(2)},${Number(superbill.paid_amount || 0).toFixed(2)}`;

        return new NextResponse(csvData, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="superbill-${superbill.superbill_number}.csv"`,
          },
        });
      }

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
            },
          },
        },
      });

      // Handle CSV export if requested
      if (format === "csv") {
        let csvData =
          "Statement #,Date,Service,DX,Description,Units,Fee,Paid\n";

        superbills.forEach(
          (
            superbill: Prisma.SuperbillGetPayload<{
              include: { Appointment: { include: { PracticeService: true } } };
            }>,
          ) => {
            csvData += `${superbill.superbill_number},${new Date(superbill.issued_date).toLocaleDateString()},${superbill.service_code || ""},${superbill.diagnosis_code || ""},${superbill.service_description || ""},${superbill.units},${Number(superbill.amount).toFixed(2)},${Number(superbill.paid_amount || 0).toFixed(2)}\n`;
          },
        );

        return new NextResponse(csvData, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="superbills-${clientGroupId}.csv"`,
          },
        });
      }

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
          Appointment: true,
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
    const { appointment_id } = data;

    // Validate required parameters
    if (!appointment_id) {
      return NextResponse.json(
        { error: "Missing required parameter: appointment_id" },
        { status: 400 },
      );
    }

    // Get appointment details
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointment_id },
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

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 },
      );
    }

    if (!appointment.client_group_id) {
      return NextResponse.json(
        { error: "Appointment has no associated client group" },
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
    const clientName = appointment.ClientGroup?.ClientGroupMembership[0]?.Client
      ? `${appointment.ClientGroup.ClientGroupMembership[0].Client.legal_first_name} ${appointment.ClientGroup.ClientGroupMembership[0].Client.legal_last_name}`
      : "";

    // Create the superbill
    const createdSuperbill = await prisma.superbill.create({
      data: {
        superbill_number: nextSuperbillNumber,
        client_group_id: appointment.client_group_id,
        appointment_id: appointment.id,
        amount: appointment.appointment_fee || 0,
        service_code: appointment?.PracticeService?.code || "",
        service_description: appointment?.PracticeService?.description || "",
        units: 1,
        provider_name: appointment?.Clinician
          ? `${appointment.Clinician.first_name} ${appointment.Clinician.last_name}`
          : "",
        provider_email: appointment?.Clinician?.User
          ? appointment.Clinician.User.email
          : "",
        client_name: clientName,
        status: "CREATED",
        created_by: clinicianId || null,
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
