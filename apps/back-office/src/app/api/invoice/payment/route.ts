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

// Define type as _BatchPaymentData to indicate it's intentionally unused
// We keep it for documentation purposes
type _BatchPaymentData = z.infer<typeof batchPaymentSchema>;

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
