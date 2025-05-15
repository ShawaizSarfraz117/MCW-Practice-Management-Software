import { NextRequest, NextResponse } from "next/server";
import { prisma, Prisma } from "@mcw/database";
import { getClinicianInfo } from "@/utils/helpers";
import { logger } from "@mcw/logger";

type InvoiceWithRelations = Prisma.InvoiceGetPayload<{
  include: {
    ClientGroup: true;
  };
}>;

type SuperbillWithRelations = Prisma.SuperbillGetPayload<{
  include: {
    ClientGroup: true;
  };
}>;

// Define the interface directly
interface StatementWithRelations {
  id: string;
  statement_number: number;
  client_group_id: string;
  created_at: Date;
  start_date?: Date | null;
  end_date?: Date | null;
  beginning_balance: Prisma.Decimal;
  invoices_total: Prisma.Decimal;
  payments_total: Prisma.Decimal;
  ending_balance: Prisma.Decimal;
  provider_name?: string | null;
  provider_email?: string | null;
  provider_phone?: string | null;
  client_group_name: string;
  client_name: string;
  client_email?: string | null;
  created_by?: string | null;
  ClientGroup?: {
    id: string;
    name: string;
  };
}

// Valid document types
type DocumentType = "invoice" | "superbill" | "statement";

// GET - Retrieve billing documents (invoices, superbills, statements)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const clientGroupId = searchParams.get("clientGroupId"); // Optional now
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const typeParam = searchParams.get("type"); // Can be a single type or a JSON array
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    // Parse types parameter - could be a single value or a JSON array
    let types: DocumentType[] = [];
    if (typeParam) {
      try {
        // Try to parse as JSON array
        const parsedTypes = JSON.parse(typeParam);
        if (Array.isArray(parsedTypes)) {
          // Make sure all types are valid
          types = parsedTypes.filter((t) =>
            ["invoice", "superbill", "statement"].includes(t),
          ) as DocumentType[];
        } else if (
          typeof parsedTypes === "string" &&
          ["invoice", "superbill", "statement"].includes(parsedTypes)
        ) {
          // Single type as a string in JSON format
          types = [parsedTypes as DocumentType];
        }
      } catch (_e) {
        // If parsing fails, treat as a single type string
        if (["invoice", "superbill", "statement"].includes(typeParam)) {
          types = [typeParam as DocumentType];
        }
      }
    }

    // If no valid types specified, include all
    const fetchAll = types.length === 0;

    // Parse dates if provided
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate) {
      const parsedStartDate = new Date(startDate);
      if (!isNaN(parsedStartDate.getTime())) {
        dateFilter.gte = parsedStartDate;
      }
    }
    if (endDate) {
      const parsedEndDate = new Date(endDate);
      if (!isNaN(parsedEndDate.getTime())) {
        // Set to end of day
        parsedEndDate.setHours(23, 59, 59, 999);
        dateFilter.lte = parsedEndDate;
      }
    }

    // Get clinician info for filtering
    const { clinicianId } = await getClinicianInfo();

    // Prepare document fetching based on type
    let invoices: InvoiceWithRelations[] = [];
    let superbills: SuperbillWithRelations[] = [];
    let statements: StatementWithRelations[] = [];
    let total = 0;

    // Build the where clause
    const invoiceWhere: Prisma.InvoiceWhereInput = {};
    const superbillWhere: Prisma.SuperbillWhereInput = {};
    const statementWhere: Prisma.StatementWhereInput = {};

    // Add date filters if provided
    if (Object.keys(dateFilter).length > 0) {
      invoiceWhere.issued_date = dateFilter;
      superbillWhere.issued_date = dateFilter;
      statementWhere.created_at = dateFilter;
    }

    // Add clinician filter
    if (clinicianId) {
      invoiceWhere.clinician_id = clinicianId;
      superbillWhere.created_by = clinicianId;
      statementWhere.created_by = clinicianId;
    }

    // Add clientGroupId filter only if provided
    if (clientGroupId) {
      invoiceWhere.client_group_id = clientGroupId;
      superbillWhere.client_group_id = clientGroupId;
      statementWhere.client_group_id = clientGroupId;
    }

    // Fetch invoices if requested or if fetching all types
    if (fetchAll || types.includes("invoice")) {
      invoices = await prisma.invoice.findMany({
        where: invoiceWhere,
        include: {
          ClientGroup: true,
        },
        orderBy: { issued_date: "desc" },
        ...(types.length > 0 ? { skip, take: limit } : {}),
      });
    }

    // Fetch superbills if requested or if fetching all types
    if (fetchAll || types.includes("superbill")) {
      superbills = await prisma.superbill.findMany({
        where: superbillWhere,
        include: {
          ClientGroup: true,
        },
        orderBy: { issued_date: "desc" },
        ...(types.length > 0 ? { skip, take: limit } : {}),
      });
    }

    // Fetch statements if requested or if fetching all types
    if (fetchAll || types.includes("statement")) {
      statements = await prisma.statement.findMany({
        where: statementWhere,
        include: {
          ClientGroup: true,
        },
        orderBy: { created_at: "desc" },
        ...(types.length > 0 ? { skip, take: limit } : {}),
      });
    }

    // Combine all documents into one array with type indicator
    const documents = [
      ...invoices.map((invoice) => ({
        ...invoice,
        documentType: "invoice",
        date: invoice.issued_date,
        number: invoice.invoice_number,
        total: Number(invoice.amount),
        clientGroupName: invoice.ClientGroup?.name || "",
      })),
      ...superbills.map((superbill) => ({
        ...superbill,
        documentType: "superbill",
        date: superbill.issued_date,
        number: superbill.superbill_number.toString(),
        total: Number(superbill.amount),
        clientGroupName: superbill.ClientGroup?.name || "",
      })),
      ...statements.map((statement) => ({
        ...statement,
        documentType: "statement",
        date: statement.created_at,
        number: statement.statement_number.toString(),
        total: Number(statement.ending_balance),
        clientGroupName: statement.ClientGroup?.name || "",
      })),
    ];

    // Sort combined results by date (newest first)
    const sortedDocuments = documents.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    // If we're fetching all types or multiple types, apply pagination manually to the combined results
    let paginatedDocuments = sortedDocuments;
    if (fetchAll || types.length > 1) {
      total = sortedDocuments.length;
      paginatedDocuments = sortedDocuments.slice(skip, skip + limit);
    } else if (types.length === 1) {
      // When filtering by a single type, we already applied pagination in the individual queries
      total =
        types[0] === "invoice"
          ? invoices.length
          : types[0] === "superbill"
            ? superbills.length
            : statements.length;
    }

    return NextResponse.json({
      data: paginatedDocuments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error({
      message: "Error fetching billing documents",
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        error: "Failed to fetch billing documents",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
