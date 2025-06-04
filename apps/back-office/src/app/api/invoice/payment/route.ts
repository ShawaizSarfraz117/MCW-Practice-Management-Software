import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { z } from "zod";
import { getClinicianInfo } from "@/utils/helpers";

// Schema for invoice with payment
const invoiceWithPaymentSchema = z.object({
  id: z.string().uuid(),
  amount: z.number(),
  invoice_number: z.string().optional(),
  status: z.string().optional(),
  // Include other invoice fields as needed
});

// Schema for batch payment data (multiple invoices)
const batchPaymentSchema = z.object({
  invoiceWithPayment: z.array(invoiceWithPaymentSchema),
  client_group_id: z.string().uuid(),
  status: z.string(),
  transaction_id: z.string().optional(),
  credit_card_id: z.string().uuid().optional(),
  applyCredit: z.boolean().optional(),
  credit_applied: z.number().optional(),
  response: z.string().optional(),
});

// Helper function to get payment data with date range filtering
async function getPaymentData(startDate: string, endDate: string) {
  // Parse dates and validate they are valid
  const startDateTime = new Date(startDate);
  const endDateTime = new Date(endDate);

  if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
    throw new Error("Invalid date format");
  }

  // Set end date to end of day
  endDateTime.setHours(23, 59, 59, 999);

  // Check if user is a clinician
  const { isClinician, clinicianId } = await getClinicianInfo();

  // Base query for payments within date range
  const where = {
    payment_date: {
      gte: startDateTime,
      lte: endDateTime,
    },
  };

  // Query invoices and payments
  if (isClinician && clinicianId) {
    // If user is a clinician, only show their invoices
    return await prisma.payment.findMany({
      where: {
        ...where,
        Invoice: {
          clinician_id: clinicianId,
        },
      },
      include: {
        Invoice: {
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
            Clinician: true,
          },
        },
        CreditCard: true,
      },
      orderBy: {
        payment_date: "desc",
      },
    });
  } else {
    // If user is not a clinician, show all invoices
    return await prisma.payment.findMany({
      where,
      include: {
        Invoice: {
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
            Clinician: true,
          },
        },
        CreditCard: true,
      },
      orderBy: {
        payment_date: "desc",
      },
    });
  }
}

// GET endpoint for retrieving payments
export async function GET(req: NextRequest) {
  try {
    // Get URL parameters
    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const format = searchParams.get("format");

    // Validate date parameters
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start date and end date are required" },
        { status: 400 },
      );
    }

    const results = await getPaymentData(startDate, endDate);

    // If format=csv, return CSV export
    if (format === "csv") {
      // Format the data for CSV
      const csvData = formatPaymentsForCSV(
        results as unknown as PaymentForCSV[],
      );

      // Create CSV content
      const csvContent = generateCSV(csvData);

      // Set appropriate headers for CSV download
      const headers = new Headers({
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="payment_export_${startDate}_to_${endDate}.csv"`,
      });

      return new NextResponse(csvContent, {
        status: 200,
        headers,
      });
    }

    // Otherwise return JSON
    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching payments:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch payments",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Define CSV row structure with index signature to allow string indexing
interface CSVRow {
  Date: string;
  Type: string;
  Description: string;
  Amount: string;
  [key: string]: string; // Index signature
}

// Define the minimal structure needed for formatting payments to CSV
interface PaymentForCSV {
  payment_date: Date;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  amount: any;
  credit_card_id?: string | null;
  CreditCard?: unknown | null;
  Invoice?: {
    ClientGroup?: {
      name?: string;
      ClientGroupMembership?: Array<{
        Client?: {
          legal_first_name: string;
          legal_last_name: string;
        };
      }>;
    };
  };
}

// Format the payment data into the CSV structure shown in the image
// Using a more specific type instead of 'any'
function formatPaymentsForCSV(payments: PaymentForCSV[]): CSVRow[] {
  return payments.map((payment) => {
    // Get client name from payment data
    let clientName = "";

    if (payment.Invoice?.ClientGroup) {
      const memberships =
        payment.Invoice.ClientGroup.ClientGroupMembership || [];
      if (memberships.length > 0 && memberships[0].Client) {
        const client = memberships[0].Client;
        clientName = `${client.legal_first_name} ${client.legal_last_name}`;
      } else {
        clientName = payment.Invoice.ClientGroup.name || "";
      }
    }

    // Format date (e.g., "5/14/2025")
    const date = new Date(payment.payment_date);
    const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;

    // Determine type - in the image, it shows "Payment from [client]" or "Invoice for [client]" or "Session with [client]"
    const type = `Payment from ${clientName}`;

    // Description (in the image it shows "Cash" for payments)
    const description = payment.CreditCard ? "Credit Card" : "Cash";

    // Format amount (e.g., "+ $20")
    const formattedAmount = `+ $${Number(payment.amount).toFixed(2)}`;

    return {
      Date: formattedDate,
      Type: type,
      Description: description,
      Amount: formattedAmount,
    };
  });
}

// Generate CSV string from data
function generateCSV(data: CSVRow[]): string {
  if (!data || data.length === 0) {
    // Return headers only if no data
    return "Date,Type,Description,Amount\n";
  }

  // Get headers from the first item
  const headers = Object.keys(data[0]);

  // Create CSV header row
  let csv = headers.join(",") + "\n";

  // Add data rows
  data.forEach((row) => {
    const values = headers.map((header) => {
      // Escape quotes in values and wrap in quotes if it contains comma or quotes
      const value = row[header]?.toString() || "";
      const escapedValue = value.replace(/"/g, '""');
      return value.includes(",") || value.includes('"')
        ? `"${escapedValue}"`
        : escapedValue;
    });
    csv += values.join(",") + "\n";
  });

  return csv;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Payment request body:", JSON.stringify(body));

    // Validate request body
    const validatedData = batchPaymentSchema.parse(body);
    console.log("Validated as batch payment");

    // Filter selected invoices (those with amount > 0)
    const selectedInvoices = validatedData.invoiceWithPayment.filter(
      (inv) => inv.amount > 0,
    );

    if (selectedInvoices.length === 0) {
      return NextResponse.json(
        { error: "No valid invoices selected for payment" },
        { status: 400 },
      );
    }

    // Use Prisma transaction to ensure all operations complete successfully or fail together
    const payments = await prisma.$transaction(async (tx) => {
      const createdPayments = [];

      // Track remaining credit to apply
      let remainingCredit =
        validatedData.applyCredit && validatedData.credit_applied
          ? validatedData.credit_applied
          : 0;

      // Process each selected invoice
      for (const invoiceData of selectedInvoices) {
        // Fetch current invoice to check its status and existing payments
        const invoice = await tx.invoice.findUnique({
          where: { id: invoiceData.id },
          include: { Payment: true },
        });

        if (!invoice) {
          throw new Error(`Invoice with ID ${invoiceData.id} not found`);
        }

        // Check credit card if provided
        if (validatedData.credit_card_id) {
          const creditCard = await tx.creditCard.findUnique({
            where: { id: validatedData.credit_card_id },
          });

          if (!creditCard) {
            throw new Error(
              `Credit card with ID ${validatedData.credit_card_id} not found`,
            );
          }
        }

        // Calculate total payments for this invoice (including the new payment)
        const existingPaymentsTotal = invoice.Payment.reduce(
          (sum, payment) => sum + Number(payment.amount),
          0,
        );
        const existingPaymentsCredit = invoice.Payment.reduce(
          (sum, payment) => sum + Number(payment.credit_applied || 0),
          0,
        );

        // Determine credit to apply to this invoice (up to the invoice amount)
        let creditToApply = 0;
        if (validatedData.applyCredit && remainingCredit > 0) {
          // Apply credit up to the invoice amount or remaining credit, whichever is less
          creditToApply = Math.min(invoiceData.amount, remainingCredit);
          remainingCredit -= creditToApply;
        }

        // Create payment for this invoice
        const newPayment = await tx.payment.create({
          data: {
            invoice_id: invoiceData.id,
            amount: Math.abs(invoiceData.amount - creditToApply),
            credit_card_id: validatedData.credit_card_id || null,
            transaction_id: validatedData.transaction_id,
            status: validatedData.status,
            response: validatedData.response,
            payment_date: new Date(),
            credit_applied: creditToApply,
          },
        });

        createdPayments.push(newPayment);

        // If total payments reach or exceed the invoice amount, update status to PAID
        const totalPaid =
          existingPaymentsTotal +
          Number(invoiceData.amount) +
          existingPaymentsCredit;
        if (totalPaid >= Number(invoice.amount)) {
          await tx.invoice.update({
            where: { id: invoiceData.id },
            data: { status: "PAID" },
          });
        }
      }

      // If applyCredit is true, update client group's available credit
      if (
        validatedData.applyCredit === true &&
        validatedData.credit_applied &&
        validatedData.credit_applied > 0
      ) {
        const creditUsed = validatedData.credit_applied - remainingCredit;
        await prisma.clientGroup.update({
          where: { id: validatedData.client_group_id },
          data: { available_credit: { decrement: creditUsed } },
        });
      }

      return createdPayments;
    });

    return NextResponse.json(payments, { status: 201 });
  } catch (error) {
    console.error("Payment creation error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    // Handle specific errors
    if (error instanceof Error) {
      if (
        error.message.includes("Invoice with ID") &&
        error.message.includes("not found")
      ) {
        return NextResponse.json(
          { error: "Invoice not found" },
          { status: 404 },
        );
      }

      if (
        error.message.includes("Credit card with ID") &&
        error.message.includes("not found")
      ) {
        return NextResponse.json(
          { error: "Credit card not found" },
          { status: 404 },
        );
      }
    }

    return NextResponse.json(
      {
        error: "Failed to create payment",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
