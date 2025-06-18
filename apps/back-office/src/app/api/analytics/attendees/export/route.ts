import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@mcw/utils";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import {
  Prisma,
  Appointment,
  ClientGroup,
  ClientGroupMembership,
  Client,
} from "@prisma/client";
import { getBackOfficeSession } from "@/utils/helpers";
import * as XLSX from "xlsx";

interface AppointmentWithRelations extends Appointment {
  ClientGroup: ClientGroup & {
    ClientGroupMembership: (ClientGroupMembership & {
      Client: Pick<
        Client,
        "legal_first_name" | "legal_last_name" | "preferred_name"
      >;
    })[];
  };
}

// GET - Export attendance data as CSV or Excel
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await getBackOfficeSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const clientGroupId = searchParams.get("clientGroupId");
  const status = searchParams.get("status");
  const format = searchParams.get("format") || "csv";

  // Validate required parameters
  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "Start date and end date are required" },
      { status: 400 },
    );
  }

  if (!["csv", "excel"].includes(format)) {
    return NextResponse.json(
      { error: "Format must be either 'csv' or 'excel'" },
      { status: 400 },
    );
  }

  try {
    // Build where clause for appointments
    const appointmentWhere: Prisma.AppointmentWhereInput = {
      start_date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
      type: "APPOINTMENT", // Only show client appointments, not internal events
    };

    // Add status filter if provided
    if (status && status !== "all") {
      appointmentWhere.status = status.toUpperCase();
    }

    // Add client group filter if provided
    if (clientGroupId && clientGroupId !== "all") {
      appointmentWhere.client_group_id = clientGroupId;
    }

    // Fetch all appointments for export (no pagination)
    const appointments = (await prisma.appointment.findMany({
      where: appointmentWhere,
      include: {
        ClientGroup: {
          include: {
            ClientGroupMembership: {
              include: {
                Client: {
                  select: {
                    legal_first_name: true,
                    legal_last_name: true,
                    preferred_name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        start_date: "desc",
      },
    })) as AppointmentWithRelations[];

    if (format === "csv") {
      // Generate CSV
      const headers = [
        "Client",
        "Date of Service",
        "Start Time",
        "End Time",
        "Status",
      ];
      const csvRows = [headers.join(",")];

      appointments.forEach((appointment) => {
        const clientName = getClientName(appointment);
        // Format date as MM/DD/YYYY to ensure consistency
        const date = new Date(appointment.start_date);
        const dateOfService = `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}/${date.getFullYear()}`;
        const startTime = new Date(appointment.start_date).toLocaleTimeString(
          "en-US",
          {
            hour: "2-digit",
            minute: "2-digit",
          },
        );
        const endTime = new Date(appointment.end_date).toLocaleTimeString(
          "en-US",
          {
            hour: "2-digit",
            minute: "2-digit",
          },
        );
        const status = formatStatus(appointment.status);

        const row = [
          `"${clientName}"`,
          `"${dateOfService}"`,
          `"${startTime}"`,
          `"${endTime}"`,
          `"${status}"`,
        ];
        csvRows.push(row.join(","));
      });

      const csvContent = csvRows.join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="attendance-report-${startDate}-to-${endDate}.csv"`,
        },
      });
    } else {
      // Generate Excel
      const worksheetData = [
        ["Client", "Date of Service", "Start Time", "End Time", "Status"],
      ];

      appointments.forEach((appointment) => {
        const clientName = getClientName(appointment);
        // Format date as MM/DD/YYYY to ensure Excel compatibility
        const date = new Date(appointment.start_date);
        const dateOfService = `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}/${date.getFullYear()}`;
        const startTime = new Date(appointment.start_date).toLocaleTimeString(
          "en-US",
          {
            hour: "2-digit",
            minute: "2-digit",
          },
        );
        const endTime = new Date(appointment.end_date).toLocaleTimeString(
          "en-US",
          {
            hour: "2-digit",
            minute: "2-digit",
          },
        );
        const status = formatStatus(appointment.status);

        worksheetData.push([
          clientName,
          dateOfService,
          startTime,
          endTime,
          status,
        ]);
      });

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(worksheetData);

      // Set column widths to prevent #### display
      const columnWidths = [
        { wch: 35 }, // Client name column (increased)
        { wch: 20 }, // Date of Service column (increased)
        { wch: 15 }, // Start Time column
        { wch: 15 }, // End Time column
        { wch: 20 }, // Status column (increased)
      ];
      ws["!cols"] = columnWidths;

      // Format date columns as text to prevent Excel auto-formatting issues
      const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
      for (let row = 1; row <= range.e.r; row++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: 1 }); // Column B (Date of Service)
        if (ws[cellAddress]) {
          ws[cellAddress].t = "s"; // Force as string/text
        }
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Attendance Report");

      // Generate Excel buffer
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

      return new NextResponse(excelBuffer, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="attendance-report-${startDate}-to-${endDate}.xlsx"`,
        },
      });
    }
  } catch (error) {
    logger.error({
      message: "Error exporting attendance data",
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to export attendance data" },
      { status: 500 },
    );
  }
});

function getClientName(appointment: AppointmentWithRelations) {
  const memberships = appointment.ClientGroup?.ClientGroupMembership || [];
  if (memberships.length === 0) return "Unknown Client";

  if (memberships.length === 1) {
    const client = memberships[0].Client;
    return (
      client.preferred_name ||
      `${client.legal_first_name} ${client.legal_last_name}`
    );
  }

  // For multiple members (couples, families), show group name or combine names
  const names = memberships.map((membership) => {
    const client = membership.Client;
    return (
      client.preferred_name ||
      `${client.legal_first_name} ${client.legal_last_name}`
    );
  });

  return names.join(" & ");
}

function formatStatus(status: string) {
  switch (status.toLowerCase()) {
    case "no_show":
      return "No Show";
    case "late_cancelled":
      return "Late Cancelled";
    case "clinician_cancelled":
      return "Clinician Cancelled";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }
}
