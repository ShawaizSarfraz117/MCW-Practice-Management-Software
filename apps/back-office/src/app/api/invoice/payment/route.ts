import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { z } from "zod";

// Schema for invoice with payment
const invoiceWithPaymentSchema = z.object({
  id: z.string().uuid(),
  amount: z.number(),
  invoice_number: z.string().optional(),
  status: z.string().optional(),
  // Include other invoice fields as needed
});

// Schema for validating payment data
const paymentSchema = z.object({
  invoiceWithPayment: z.array(invoiceWithPaymentSchema),
  client_group_id: z.string().uuid(),
  status: z.string(),
  transaction_id: z.string().optional(),
  applyCredit: z.boolean().optional(),
  credit_applied: z.number().optional(),
  response: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request body
    const validatedData = paymentSchema.parse(body);

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

        // Calculate total payments for this invoice (including the new payment)
        const existingPaymentsTotal = invoice.Payment.reduce(
          (sum, payment) => sum + Number(payment.amount),
          0,
        );
        const existingPaymentsCredit = invoice.Payment.reduce(
          (sum, payment) => sum + Number(payment.credit_applied),
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Payment creation error:", error);
    return NextResponse.json(
      {
        error: "Failed to create payment",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
