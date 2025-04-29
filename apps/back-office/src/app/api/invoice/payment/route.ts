import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { z } from "zod";

// Schema for validating payment data
const paymentSchema = z.object({
  invoice_id: z.string().uuid(),
  amount: z.number().positive(),
  credit_card_id: z.string().uuid().optional(),
  transaction_id: z.string().optional(),
  status: z.string(),
  response: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request body
    const validatedData = paymentSchema.parse(body);

    // Check if invoice exists
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: validatedData.invoice_id,
      },
      include: {
        Payment: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // If a credit card ID is provided, check if it exists
    if (validatedData.credit_card_id) {
      const creditCard = await prisma.creditCard.findUnique({
        where: {
          id: validatedData.credit_card_id,
        },
      });

      if (!creditCard) {
        return NextResponse.json(
          { error: "Credit card not found" },
          { status: 404 },
        );
      }
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        invoice_id: validatedData.invoice_id,
        amount: validatedData.amount,
        credit_card_id: validatedData.credit_card_id,
        transaction_id: validatedData.transaction_id,
        status: validatedData.status,
        response: validatedData.response,
        payment_date: new Date(),
      },
    });

    // Calculate total payments for this invoice (including the new payment)
    const totalPayments =
      Number(validatedData.amount) +
      invoice.Payment.reduce((sum, payment) => sum + Number(payment.amount), 0);

    // If total payments reach or exceed the invoice amount, update status to PAID
    if (totalPayments >= Number(invoice.amount)) {
      await prisma.invoice.update({
        where: { id: validatedData.invoice_id },
        data: { status: "PAID" },
      });
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 },
    );
  }
}
