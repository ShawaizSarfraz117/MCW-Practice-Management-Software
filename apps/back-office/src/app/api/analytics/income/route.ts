import { withErrorHandling } from "@mcw/utils";
import { prisma } from "@mcw/database";
import { NextRequest, NextResponse } from "next/server";

interface IncomeReportItem {
  date: string;
  clientPayments: number;
  grossIncome: number;
  netIncome: number;
  clinicianCut: number;
}

interface IncomeReportResponse {
  data: IncomeReportItem[];
  totals: {
    clientPayments: number;
    grossIncome: number;
    netIncome: number;
    clinicianCut: number;
  };
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
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const clinicianId = searchParams.get("clinicianId");

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "Start date and end date are required" },
      { status: 400 },
    );
  }

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0); // Set to start of day

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999); // Set to end of day

  // Validate dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  // Calculate offset for pagination
  const skip = (page - 1) * limit;

  try {
    // Get aggregated income data by month using raw SQL
    let incomeData;
    let totalsData;

    if (clinicianId && clinicianId !== "all") {
      // Query with clinician filter
      incomeData = (await prisma.$queryRaw`
        SELECT 
          FORMAT(p.payment_date, 'yyyy-MM') as date,
          ROUND(SUM(p.amount + ISNULL(p.credit_applied, 0)), 2) as clientPayments,
          ROUND(SUM(
            CASE 
              WHEN a.appointment_fee IS NOT NULL 
              THEN a.appointment_fee + ISNULL(a.adjustable_amount, 0) - ISNULL(a.write_off, 0)
              ELSE p.amount + ISNULL(p.credit_applied, 0)
            END
          ), 2) as grossIncome,
          ROUND(SUM(
            CASE 
              WHEN c.percentage_split IS NOT NULL AND a.appointment_fee IS NOT NULL
              THEN (a.appointment_fee + ISNULL(a.adjustable_amount, 0) - ISNULL(a.write_off, 0)) * (c.percentage_split / 100.0)
              WHEN c.percentage_split IS NOT NULL
              THEN (p.amount + ISNULL(p.credit_applied, 0)) * (c.percentage_split / 100.0)
              ELSE 0
            END
          ), 2) as clinicianCut,
          ROUND(SUM(
            CASE 
              WHEN a.appointment_fee IS NOT NULL 
              THEN a.appointment_fee + ISNULL(a.adjustable_amount, 0) - ISNULL(a.write_off, 0)
              ELSE p.amount + ISNULL(p.credit_applied, 0)
            END
          ) - SUM(
            CASE 
              WHEN c.percentage_split IS NOT NULL AND a.appointment_fee IS NOT NULL
              THEN (a.appointment_fee + ISNULL(a.adjustable_amount, 0) - ISNULL(a.write_off, 0)) * (c.percentage_split / 100.0)
              WHEN c.percentage_split IS NOT NULL
              THEN (p.amount + ISNULL(p.credit_applied, 0)) * (c.percentage_split / 100.0)
              ELSE 0
            END
          ), 2) as netIncome
        FROM Payment p
        INNER JOIN Invoice i ON p.invoice_id = i.id
        LEFT JOIN Appointment a ON i.appointment_id = a.id
        LEFT JOIN Clinician c ON i.clinician_id = c.id
        WHERE p.payment_date >= ${start}
          AND p.payment_date <= ${end}
          AND p.status = 'COMPLETED'
          AND i.clinician_id = ${clinicianId}
        GROUP BY FORMAT(p.payment_date, 'yyyy-MM')
        ORDER BY FORMAT(p.payment_date, 'yyyy-MM') DESC
        OFFSET ${skip} ROWS
        FETCH NEXT ${limit} ROWS ONLY
      `) as Array<{
        date: string;
        clientPayments: number;
        grossIncome: number;
        clinicianCut: number;
        netIncome: number;
      }>;

      // Get totals with clinician filter
      totalsData = (await prisma.$queryRaw`
        SELECT 
          ROUND(SUM(p.amount + ISNULL(p.credit_applied, 0)), 2) as clientPayments,
          ROUND(SUM(
            CASE 
              WHEN a.appointment_fee IS NOT NULL 
              THEN a.appointment_fee + ISNULL(a.adjustable_amount, 0) - ISNULL(a.write_off, 0)
              ELSE p.amount + ISNULL(p.credit_applied, 0)
            END
          ), 2) as grossIncome,
          ROUND(SUM(
            CASE 
              WHEN c.percentage_split IS NOT NULL AND a.appointment_fee IS NOT NULL
              THEN (a.appointment_fee + ISNULL(a.adjustable_amount, 0) - ISNULL(a.write_off, 0)) * (c.percentage_split / 100.0)
              WHEN c.percentage_split IS NOT NULL
              THEN (p.amount + ISNULL(p.credit_applied, 0)) * (c.percentage_split / 100.0)
              ELSE 0
            END
          ), 2) as clinicianCut,
          ROUND(SUM(
            CASE 
              WHEN a.appointment_fee IS NOT NULL 
              THEN a.appointment_fee + ISNULL(a.adjustable_amount, 0) - ISNULL(a.write_off, 0)
              ELSE p.amount + ISNULL(p.credit_applied, 0)
            END
          ) - SUM(
            CASE 
              WHEN c.percentage_split IS NOT NULL AND a.appointment_fee IS NOT NULL
              THEN (a.appointment_fee + ISNULL(a.adjustable_amount, 0) - ISNULL(a.write_off, 0)) * (c.percentage_split / 100.0)
              WHEN c.percentage_split IS NOT NULL
              THEN (p.amount + ISNULL(p.credit_applied, 0)) * (c.percentage_split / 100.0)
              ELSE 0
            END
          ), 2) as netIncome,
          COUNT(DISTINCT FORMAT(p.payment_date, 'yyyy-MM')) as totalMonths
        FROM Payment p
        INNER JOIN Invoice i ON p.invoice_id = i.id
        LEFT JOIN Appointment a ON i.appointment_id = a.id
        LEFT JOIN Clinician c ON i.clinician_id = c.id
        WHERE p.payment_date >= ${start}
          AND p.payment_date <= ${end}
          AND p.status = 'COMPLETED'
          AND i.clinician_id = ${clinicianId}
      `) as Array<{
        clientPayments: number;
        grossIncome: number;
        clinicianCut: number;
        netIncome: number;
        totalMonths: number;
      }>;
    } else {
      // Query without clinician filter
      incomeData = (await prisma.$queryRaw`
        SELECT 
          FORMAT(p.payment_date, 'yyyy-MM') as date,
          ROUND(SUM(p.amount + ISNULL(p.credit_applied, 0)), 2) as clientPayments,
          ROUND(SUM(
            CASE 
              WHEN a.appointment_fee IS NOT NULL 
              THEN a.appointment_fee + ISNULL(a.adjustable_amount, 0) - ISNULL(a.write_off, 0)
              ELSE p.amount + ISNULL(p.credit_applied, 0)
            END
          ), 2) as grossIncome,
          ROUND(SUM(
            CASE 
              WHEN c.percentage_split IS NOT NULL AND a.appointment_fee IS NOT NULL
              THEN (a.appointment_fee + ISNULL(a.adjustable_amount, 0) - ISNULL(a.write_off, 0)) * (c.percentage_split / 100.0)
              WHEN c.percentage_split IS NOT NULL
              THEN (p.amount + ISNULL(p.credit_applied, 0)) * (c.percentage_split / 100.0)
              ELSE 0
            END
          ), 2) as clinicianCut,
          ROUND(SUM(
            CASE 
              WHEN a.appointment_fee IS NOT NULL 
              THEN a.appointment_fee + ISNULL(a.adjustable_amount, 0) - ISNULL(a.write_off, 0)
              ELSE p.amount + ISNULL(p.credit_applied, 0)
            END
          ) - SUM(
            CASE 
              WHEN c.percentage_split IS NOT NULL AND a.appointment_fee IS NOT NULL
              THEN (a.appointment_fee + ISNULL(a.adjustable_amount, 0) - ISNULL(a.write_off, 0)) * (c.percentage_split / 100.0)
              WHEN c.percentage_split IS NOT NULL
              THEN (p.amount + ISNULL(p.credit_applied, 0)) * (c.percentage_split / 100.0)
              ELSE 0
            END
          ), 2) as netIncome
        FROM Payment p
        INNER JOIN Invoice i ON p.invoice_id = i.id
        LEFT JOIN Appointment a ON i.appointment_id = a.id
        LEFT JOIN Clinician c ON i.clinician_id = c.id
        WHERE p.payment_date >= ${start}
          AND p.payment_date <= ${end}
          AND p.status = 'COMPLETED'
        GROUP BY FORMAT(p.payment_date, 'yyyy-MM')
        ORDER BY FORMAT(p.payment_date, 'yyyy-MM') DESC
        OFFSET ${skip} ROWS
        FETCH NEXT ${limit} ROWS ONLY
      `) as Array<{
        date: string;
        clientPayments: number;
        grossIncome: number;
        clinicianCut: number;
        netIncome: number;
      }>;

      // Get totals without clinician filter
      totalsData = (await prisma.$queryRaw`
        SELECT 
          ROUND(SUM(p.amount + ISNULL(p.credit_applied, 0)), 2) as clientPayments,
          ROUND(SUM(
            CASE 
              WHEN a.appointment_fee IS NOT NULL 
              THEN a.appointment_fee + ISNULL(a.adjustable_amount, 0) - ISNULL(a.write_off, 0)
              ELSE p.amount + ISNULL(p.credit_applied, 0)
            END
          ), 2) as grossIncome,
          ROUND(SUM(
            CASE 
              WHEN c.percentage_split IS NOT NULL AND a.appointment_fee IS NOT NULL
              THEN (a.appointment_fee + ISNULL(a.adjustable_amount, 0) - ISNULL(a.write_off, 0)) * (c.percentage_split / 100.0)
              WHEN c.percentage_split IS NOT NULL
              THEN (p.amount + ISNULL(p.credit_applied, 0)) * (c.percentage_split / 100.0)
              ELSE 0
            END
          ), 2) as clinicianCut,
          ROUND(SUM(
            CASE 
              WHEN a.appointment_fee IS NOT NULL 
              THEN a.appointment_fee + ISNULL(a.adjustable_amount, 0) - ISNULL(a.write_off, 0)
              ELSE p.amount + ISNULL(p.credit_applied, 0)
            END
          ) - SUM(
            CASE 
              WHEN c.percentage_split IS NOT NULL AND a.appointment_fee IS NOT NULL
              THEN (a.appointment_fee + ISNULL(a.adjustable_amount, 0) - ISNULL(a.write_off, 0)) * (c.percentage_split / 100.0)
              WHEN c.percentage_split IS NOT NULL
              THEN (p.amount + ISNULL(p.credit_applied, 0)) * (c.percentage_split / 100.0)
              ELSE 0
            END
          ), 2) as netIncome,
          COUNT(DISTINCT FORMAT(p.payment_date, 'yyyy-MM')) as totalMonths
        FROM Payment p
        INNER JOIN Invoice i ON p.invoice_id = i.id
        LEFT JOIN Appointment a ON i.appointment_id = a.id
        LEFT JOIN Clinician c ON i.clinician_id = c.id
        WHERE p.payment_date >= ${start}
          AND p.payment_date <= ${end}
          AND p.status = 'COMPLETED'
      `) as Array<{
        clientPayments: number;
        grossIncome: number;
        clinicianCut: number;
        netIncome: number;
        totalMonths: number;
      }>;
    }

    const totals = totalsData[0] || {
      clientPayments: 0,
      grossIncome: 0,
      clinicianCut: 0,
      netIncome: 0,
      totalMonths: 0,
    };

    // No processing needed - data comes directly from SQL
    const reportData: IncomeReportItem[] = incomeData;
    const totalPages = Math.ceil(totals.totalMonths / limit);

    const response: IncomeReportResponse = {
      data: reportData,
      totals: {
        clientPayments: totals.clientPayments,
        grossIncome: totals.grossIncome,
        netIncome: totals.netIncome,
        clinicianCut: totals.clinicianCut,
      },
      pagination: {
        page,
        limit,
        total: totals.totalMonths,
        totalPages,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching income analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch income analytics" },
      { status: 500 },
    );
  }
});
