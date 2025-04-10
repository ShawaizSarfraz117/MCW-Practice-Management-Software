import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";

// GET - Retrieve all invoices or a specific invoice by ID
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (id) {
      logger.info("Retrieving specific invoice");
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          ClientGroup: true,
          Appointment: true,
          Clinician: true,
          Payment: true,
        },
      });

      if (!invoice) {
        return NextResponse.json(
          { error: "Invoice not found" },
          { status: 404 },
        );
      }

      return NextResponse.json(invoice);
    } else {
      logger.info("Retrieving all invoices");
      const invoices = await prisma.invoice.findMany({
        include: {
          ClientGroup: true,
          Appointment: true,
          Clinician: true,
          Payment: true,
        },
      });

      return NextResponse.json(invoices);
    }
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 },
    );
  }
}

// POST - Create a new invoice
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.clinician_id || !data.amount || !data.due_date) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: clinician_id, amount, and due_date are required",
        },
        { status: 400 },
      );
    }

    // Generate invoice number (you might want to implement your own logic)
    const invoiceNumber = `INV-${Date.now()}`;

    // Create new invoice
    const newInvoice = await prisma.invoice.create({
      data: {
        invoice_number: invoiceNumber,
        client_group_id: data.client_group_id,
        appointment_id: data.appointment_id,
        clinician_id: data.clinician_id,
        issued_date: new Date(), // Current date
        due_date: new Date(data.due_date),
        amount: data.amount,
        status: data.status || "PENDING", // Default status
      },
      include: {
        ClientGroup: true,
        Appointment: true,
        Clinician: true,
      },
    });

    return NextResponse.json(newInvoice, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 },
    );
  }
}
