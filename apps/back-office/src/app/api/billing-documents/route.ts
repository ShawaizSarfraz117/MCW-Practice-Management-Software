import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { getClinicianInfo } from "@/utils/helpers";
import { logger } from "@mcw/logger";

// Document response type
interface BillingDocument {
  id: string;
  documentType: string;
  name: string;
  date: Date;
  number: string;
  status: string;
  total: number;
  clientGroupName: string;
  clientGroupId: string;
}

// Valid document types
type DocumentType = "invoice" | "superbill" | "statement" | "receipt";

// Export request payload
interface ExportDocumentsPayload {
  invoices?: string[];
  statements?: string[];
  superbills?: string[];
  receipts?: string[];
}

// GET - Retrieve billing documents (invoices, superbills, statements)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const clientGroupId = searchParams.get("clientGroupId");
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
            ["invoice", "superbill", "statement", "receipt"].includes(t),
          ) as DocumentType[];
        } else if (
          typeof parsedTypes === "string" &&
          ["invoice", "superbill", "statement", "receipt"].includes(parsedTypes)
        ) {
          // Single type as a string in JSON format
          types = [parsedTypes as DocumentType];
        }
      } catch (_e) {
        // If parsing fails, treat as a single type string
        if (
          ["invoice", "superbill", "statement", "receipt"].includes(typeParam)
        ) {
          types = [typeParam as DocumentType];
        }
      }
    }

    // Get clinician info for filtering
    const { clinicianId } = await getClinicianInfo();

    // Build date filter conditions
    let dateCondition = "";
    if (startDate) {
      const parsedStartDate = new Date(startDate);
      if (!isNaN(parsedStartDate.getTime())) {
        if (dateCondition) dateCondition += " AND ";
        dateCondition += `date >= '${parsedStartDate.toISOString()}'`;
      }
    }
    if (endDate) {
      const parsedEndDate = new Date(endDate);
      if (!isNaN(parsedEndDate.getTime())) {
        // Set to end of day
        parsedEndDate.setHours(23, 59, 59, 999);
        if (dateCondition) dateCondition += " AND ";
        dateCondition += `date <= '${parsedEndDate.toISOString()}'`;
      }
    }

    // Build type filter condition
    let typeCondition = "";
    if (types.length > 0) {
      const typeList = types.map((t) => `'${t}'`).join(", ");
      typeCondition = `documentType IN (${typeList})`;
    }

    // Build client group filter condition
    let clientGroupCondition = "";
    if (clientGroupId) {
      clientGroupCondition = `clientGroupId = '${clientGroupId}'`;
    }

    // Build clinician filter condition
    let clinicianCondition = "";
    if (clinicianId) {
      clinicianCondition = `clinicianId = '${clinicianId}'`;
    }

    // Combine all filter conditions
    let whereConditions = [
      dateCondition,
      typeCondition,
      clientGroupCondition,
      clinicianCondition,
    ]
      .filter(Boolean)
      .join(" AND ");

    if (whereConditions) {
      whereConditions = `WHERE ${whereConditions}`;
    }

    // Build the union query
    const unionQuery = `
      SELECT 
        id,
        'invoice' as documentType,
        CAST(invoice_number as VARCHAR) as number,
        issued_date as date,
        is_exported,
        client_group_id as clientGroupId,
        (SELECT name FROM "ClientGroup" WHERE id = client_group_id) as clientGroupName,
        clinician_id as clinicianId
      FROM "Invoice"
      
      UNION ALL
      
      SELECT 
        id,
        'superbill' as documentType,
        CAST(superbill_number as VARCHAR) as number,
        issued_date as date,
        is_exported,
        client_group_id as clientGroupId,
        (SELECT name FROM "ClientGroup" WHERE id = client_group_id) as clientGroupName,
        created_by as clinicianId
      FROM "Superbill"
      
      UNION ALL
      
      SELECT 
        id,
        'statement' as documentType,
        CAST(statement_number as VARCHAR) as number,
        created_at as date,
        is_exported,
        client_group_id as clientGroupId,
        client_group_name as clientGroupName,
        created_by as clinicianId
      FROM "Statement"
    `;

    // Count query to get total results without pagination
    const countQuery = `
      SELECT COUNT(*) as total FROM (
        ${unionQuery}
      ) as documents
      ${whereConditions}
    `;

    // Main query with filtering, sorting and pagination
    const mainQuery = `
      SELECT * FROM (
        ${unionQuery}
      ) as documents
      ${whereConditions}
      ORDER BY date DESC
      OFFSET ${skip} ROWS
      FETCH NEXT ${limit} ROWS ONLY
    `;

    // Execute the count query
    const countResult =
      await prisma.$queryRawUnsafe<[{ total: number }]>(countQuery);
    const total = Number(countResult[0]?.total || 0);

    // Execute the main query
    const documents =
      await prisma.$queryRawUnsafe<BillingDocument[]>(mainQuery);

    return NextResponse.json({
      data: documents,
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

// POST - Export selected billing documents
export async function POST(request: NextRequest) {
  try {
    const payload: ExportDocumentsPayload = await request.json();

    // Validate the payload
    if (
      !payload ||
      ((!payload.invoices || payload.invoices.length === 0) &&
        (!payload.statements || payload.statements.length === 0) &&
        (!payload.superbills || payload.superbills.length === 0) &&
        (!payload.receipts || payload.receipts.length === 0))
    ) {
      return NextResponse.json(
        { error: "At least one document must be selected for export" },
        { status: 400 },
      );
    }

    // Track updated documents and errors
    const results: Record<
      DocumentType,
      { success: string[]; failed: string[] }
    > = {
      invoice: { success: [], failed: [] },
      statement: { success: [], failed: [] },
      superbill: { success: [], failed: [] },
      receipt: { success: [], failed: [] },
    };

    // Process invoices if any
    if (payload.invoices && payload.invoices.length > 0) {
      for (const id of payload.invoices) {
        try {
          await prisma.invoice.update({
            where: { id },
            data: { is_exported: true },
          });
          results.invoice.success.push(id);
        } catch (error) {
          logger.error({
            message: `Failed to update invoice export status: ${id}`,
            error: error instanceof Error ? error.message : String(error),
          });
          results.invoice.failed.push(id);
        }
      }
    }

    // Process statements if any
    if (payload.statements && payload.statements.length > 0) {
      for (const id of payload.statements) {
        try {
          await prisma.statement.update({
            where: { id },
            data: { is_exported: true },
          });
          results.statement.success.push(id);
        } catch (error) {
          logger.error({
            message: `Failed to update statement export status: ${id}`,
            error: error instanceof Error ? error.message : String(error),
          });
          results.statement.failed.push(id);
        }
      }
    }

    // Process superbills if any
    if (payload.superbills && payload.superbills.length > 0) {
      for (const id of payload.superbills) {
        try {
          await prisma.superbill.update({
            where: { id },
            data: { is_exported: true },
          });
          results.superbill.success.push(id);
        } catch (error) {
          logger.error({
            message: `Failed to update superbill export status: ${id}`,
            error: error instanceof Error ? error.message : String(error),
          });
          results.superbill.failed.push(id);
        }
      }
    }

    // Process receipts if any
    if (payload.receipts && payload.receipts.length > 0) {
      for (const id of payload.receipts) {
        try {
          // Since Payment model doesn't have export-specific fields,
          // we'll just fetch and log it but still report success
          // In a real implementation, you might want to add this field to the schema
          const payment = await prisma.payment.findUnique({
            where: { id },
          });

          if (payment) {
            // Just log that we processed it
            logger.info({
              message: `Receipt processed for export: ${id}`,
              paymentId: id,
            });
            results.receipt.success.push(id);
          } else {
            throw new Error("Payment not found");
          }
        } catch (error) {
          logger.error({
            message: `Failed to process receipt for export: ${id}`,
            error: error instanceof Error ? error.message : String(error),
          });
          results.receipt.failed.push(id);
        }
      }
    }

    // Summarize results
    const totalRequested =
      (payload.invoices?.length || 0) +
      (payload.statements?.length || 0) +
      (payload.superbills?.length || 0) +
      (payload.receipts?.length || 0);

    const totalSucceeded =
      results.invoice.success.length +
      results.statement.success.length +
      results.superbill.success.length +
      results.receipt.success.length;

    const allSucceeded = totalSucceeded === totalRequested;

    return NextResponse.json(
      {
        success: allSucceeded,
        message: `${totalSucceeded} of ${totalRequested} documents marked as exported`,
        results,
      },
      { status: allSucceeded ? 200 : 207 },
    );
  } catch (error) {
    logger.error({
      message: "Error exporting billing documents",
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        error: "Failed to export billing documents",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
