import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { Invoice, Prisma } from "@prisma/client";

// GET - Retrieve all invoices or a specific invoice by ID
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const clientGroupId = searchParams.get("clientGroupId");
    const status = searchParams.get("status");
    const appointmentId = searchParams.get("appointmentId");
    if (id) {
      logger.info("Retrieving specific invoice");
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          ClientGroup: {
            include: {
              ClientGroupMembership: {
                include: {
                  Client: {
                    include: {
                      ClientContact: true,
                    },
                  },
                },
              },
            },
          },
          Appointment: true,
          Clinician: {
            include: {
              User: true,
            },
          },
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
      const whereCondition: Prisma.InvoiceWhereInput = {};

      if (clientGroupId) {
        whereCondition["client_group_id"] = clientGroupId;
      }
      if (status) {
        whereCondition["status"] = status;
      }
      if (appointmentId && appointmentId !== "null") {
        whereCondition["appointment_id"] = appointmentId;
      }
      const invoices = await prisma.invoice.findMany({
        where: whereCondition,
        include: {
          ClientGroup: true,
          Appointment: true,
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

    if (data.invoice_type === "adjustment") {
      const appointment = await prisma.appointment.findUnique({
        where: { id: data.appointment_id as string },
      });
      if (!appointment) {
        return NextResponse.json(
          { error: "Appointment not found" },
          { status: 404 },
        );
      }
      const invoice = await prisma.invoice.create({
        data: {
          appointment_id: data.appointment_id as string,
          amount: Number(appointment.adjustable_amount),
          client_group_id: appointment.client_group_id,
          clinician_id: appointment.clinician_id || null,
          type: "ADJUSTMENT",
          status:
            Number(appointment.adjustable_amount) < 0 ? "CREDIT" : "UNPAID",
          invoice_number: `INV-${Date.now()}`,
          issued_date: new Date(),
          due_date: new Date(),
        },
      });
      // Reset adjustable amount
      await prisma.appointment.update({
        where: { id: data.appointment_id as string },
        data: {
          adjustable_amount: 0,
        },
      });
      if (Number(appointment.adjustable_amount) < 0) {
        await prisma.clientGroup.update({
          where: { id: appointment.client_group_id as string },
          data: {
            available_credit: {
              increment: Math.abs(Number(appointment.adjustable_amount)),
            },
          },
        });
      }
      return NextResponse.json(invoice, { status: 201 });
    } else {
      const invoiceNumber = `INV-${Date.now()}`;
      // Create new invoice
      const newInvoice = await prisma.invoice.create({
        data: {
          invoice_number: invoiceNumber,
          client_group_id: data.client_group_id,
          appointment_id: data.appointment_id,
          clinician_id: data.clinician_id || null,
          issued_date: new Date(), // Current date
          due_date: new Date(),
          amount: Number(data.amount),
          status: data.status || "UNPAID", // Default status
          type: data.type || "INVOICE",
        },
      });

      return NextResponse.json(newInvoice, { status: 201 });
    }
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json();

    const reqBody = {
      client_info: data.client_info || null,
      provider_info: data.provider_info || null,
      service_description: data.service_description || null,
      notes: data.notes || null,
    } as Invoice;

    if (data.issued_date) {
      reqBody.issued_date = new Date(data.issued_date);
    }
    if (data.due_date) {
      reqBody.due_date = new Date(data.due_date);
    }
    const invoice = await prisma.invoice.update({
      where: { id: data.id },
      data: reqBody,
    });
    return NextResponse.json(invoice, { status: 200 });
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 },
    );
  }
}
