import { withErrorHandling } from "@mcw/utils";
import { prisma } from "@mcw/database";
import { NextRequest, NextResponse } from "next/server";

interface AppointmentStatusItem {
  appointmentId: string;
  clientGroupId: string;
  dateOfService: string;
  client: string;
  billingCode: string;
  ratePerUnit: number;
  units: number;
  totalFee: number;
  status: string;
  charge: number;
  uninvoiced: number;
  paid: number;
  unpaid: number;
}

interface AppointmentStatusResponse {
  data: AppointmentStatusItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const clientGroupId = searchParams.get("clientGroupId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "Start date and end date are required" },
      { status: 400 },
    );
  }

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  // Validate dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  // Calculate offset for pagination
  const skip = (page - 1) * limit;

  try {
    // Get appointment status data using raw SQL
    const appointmentData = await prisma.$queryRawUnsafe<
      AppointmentStatusItem[]
    >(
      `
      WITH ClientNames AS (
        SELECT 
          cg.id as clientGroupId,
          STRING_AGG(
            CONCAT(c.legal_first_name, ' ', c.legal_last_name), 
            ' & '
          ) as clientName
        FROM ClientGroup cg
        INNER JOIN ClientGroupMembership cgm ON cg.id = cgm.client_group_id
        INNER JOIN Client c ON cgm.client_id = c.id
        WHERE cgm.is_contact_only = 0
        GROUP BY cg.id
      ),
      AppointmentDetails AS (
        SELECT 
          a.id as appointmentId,
          a.client_group_id as clientGroupId,
          FORMAT(a.start_date, 'MM/dd/yyyy') as dateOfService,
          cn.clientName as client,
          ISNULL(ps.code, 'N/A') as billingCode,
          ISNULL(ps.rate, 0) as ratePerUnit,
          CASE 
            WHEN ps.duration > 0 
            THEN CEILING(DATEDIFF(MINUTE, a.start_date, a.end_date) / CAST(ps.duration as FLOAT))
            ELSE 1
          END as units,
          ISNULL(a.appointment_fee, 0) as totalFee,
          CASE 
            WHEN i.id IS NULL THEN 'UNINVOICED'
            WHEN ISNULL(totalPaid.amount, 0) >= i.amount THEN 'PAID'
            WHEN ISNULL(totalPaid.amount, 0) > 0 THEN 'PARTIAL'
            ELSE 'UNPAID'
          END as status,
          ROUND(
            ISNULL(a.appointment_fee, 0) + 
            ISNULL(a.adjustable_amount, 0) - 
            ISNULL(a.write_off, 0), 2
          ) as charge,
          CASE 
            WHEN i.id IS NULL THEN ROUND(
              ISNULL(a.appointment_fee, 0) + 
              ISNULL(a.adjustable_amount, 0) - 
              ISNULL(a.write_off, 0), 2
            )
            ELSE 0
          END as uninvoiced,
          ISNULL(totalPaid.amount, 0) as paid,
          CASE 
            WHEN i.id IS NOT NULL 
            THEN ROUND(i.amount - ISNULL(totalPaid.amount, 0), 2)
            ELSE 0
          END as unpaid
        FROM Appointment a
        LEFT JOIN ClientNames cn ON a.client_group_id = cn.clientGroupId
        LEFT JOIN PracticeService ps ON a.service_id = ps.id
        LEFT JOIN Invoice i ON a.id = i.appointment_id
        LEFT JOIN (
          SELECT 
            p.invoice_id,
            SUM(p.amount + ISNULL(p.credit_applied, 0)) as amount
          FROM Payment p
          WHERE p.status = 'COMPLETED'
          GROUP BY p.invoice_id
        ) totalPaid ON i.id = totalPaid.invoice_id
        WHERE a.start_date >= @P1
          AND a.start_date <= @P2
          AND a.type = 'APPOINTMENT'
          ${clientGroupId ? "AND a.client_group_id = @P5" : ""}
      )
      SELECT 
        appointmentId,
        clientGroupId,
        dateOfService,
        ISNULL(client, 'Unknown Client') as client,
        billingCode,
        ratePerUnit,
        units,
        totalFee,
        status,
        charge,
        uninvoiced,
        paid,
        unpaid
      FROM AppointmentDetails
      ORDER BY dateOfService DESC, client
      OFFSET @P3 ROWS
      FETCH NEXT @P4 ROWS ONLY
    `,
      start,
      end,
      skip,
      limit,
      ...(clientGroupId ? [clientGroupId] : []),
    );

    // Get total count
    const countResult = await prisma.$queryRawUnsafe<[{ total: number }]>(
      `
      SELECT COUNT(*) as total
      FROM Appointment a
      WHERE a.start_date >= @P1
        AND a.start_date <= @P2
        AND a.type = 'APPOINTMENT'
        ${clientGroupId ? "AND a.client_group_id = @P3" : ""}
    `,
      start,
      end,
      ...(clientGroupId ? [clientGroupId] : []),
    );

    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    const response: AppointmentStatusResponse = {
      data: appointmentData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching appointment status:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointment status" },
      { status: 500 },
    );
  }
});
