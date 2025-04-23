/* eslint-disable max-lines-per-function */
import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@mcw/database";
import { createRequestWithBody } from "@mcw/utils";
import {
  CreditCardPrismaFactory,
  ClientGroupPrismaFactory,
  ClientPrismaFactory,
  ClinicianPrismaFactory,
} from "@mcw/database/mock-data";
import { POST } from "@/api/invoice/payment/route";

describe("Invoice Payment API Integration Tests", async () => {
  beforeEach(async () => {
    try {
      // Clean up data in correct order to respect foreign key constraints
      await prisma.payment.deleteMany({});
      await prisma.invoice.deleteMany({});
      await prisma.appointment.deleteMany({}); // Delete appointments first
      await prisma.surveyAnswers.deleteMany({});
      await prisma.creditCard.deleteMany({});
      await prisma.clientReminderPreference.deleteMany({});
      await prisma.clientContact.deleteMany({});
      await prisma.clinicianClient.deleteMany({});
      await prisma.clientGroupMembership.deleteMany({});
      await prisma.client.deleteMany({});
      await prisma.clientGroup.deleteMany({});
      await prisma.clinician.deleteMany({});
      await prisma.userRole.deleteMany({});
      await prisma.user.deleteMany({});
    } catch (error) {
      console.error("Error cleaning up database:", error);
      // Continue with the test even if cleanup fails
    }
  });

  it("POST /api/invoice/payment should create a new payment", async () => {
    // Create required related records
    const clinician = await ClinicianPrismaFactory.create();
    const clientGroup = await ClientGroupPrismaFactory.create();
    const client = await ClientPrismaFactory.create();

    // Create client group membership to link client and client group
    await prisma.clientGroupMembership.create({
      data: {
        client_group_id: clientGroup.id,
        client_id: client.id,
        role: "PRIMARY",
        is_contact_only: false,
        is_responsible_for_billing: true,
      },
    });

    const creditCard = await CreditCardPrismaFactory.create();

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        clinician_id: clinician.id,
        client_group_id: clientGroup.id,
        status: "PENDING",
        amount: "100.00", // Use string for Decimal
        invoice_number: "INV-" + Date.now(),
        due_date: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Prepare payment data
    const paymentData = {
      invoice_id: invoice.id,
      amount: 75,
      credit_card_id: creditCard.id,
      status: "COMPLETED",
      transaction_id: "tx_" + Date.now(),
      response: "Payment successful",
    };

    // Make the API request
    const req = createRequestWithBody("/api/invoice/payment", paymentData);
    const response = await POST(req);

    // Verify response
    expect(response.status).toBe(201);
    const responseData = await response.json();

    expect(responseData).toHaveProperty("id");
    expect(responseData).toHaveProperty("invoice_id", invoice.id);
    expect(responseData).toHaveProperty(
      "amount",
      paymentData.amount.toString(),
    );
    expect(responseData).toHaveProperty("credit_card_id", creditCard.id);
    expect(responseData).toHaveProperty("status", paymentData.status);

    // Verify database state
    const paymentInDb = await prisma.payment.findUnique({
      where: { id: responseData.id },
    });
    expect(paymentInDb).not.toBeNull();
    expect(paymentInDb?.invoice_id).toBe(invoice.id);
    expect(paymentInDb?.amount.toString()).toBe(paymentData.amount.toString());
  });

  it("POST /api/invoice/payment should update invoice status to PAID when fully paid", async () => {
    // Create required related records
    const clinician = await ClinicianPrismaFactory.create();
    const clientGroup = await ClientGroupPrismaFactory.create();
    const client = await ClientPrismaFactory.create();

    // Create client group membership to link client and client group
    await prisma.clientGroupMembership.create({
      data: {
        client_group_id: clientGroup.id,
        client_id: client.id,
        role: "PRIMARY",
        is_contact_only: false,
        is_responsible_for_billing: true,
      },
    });

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        clinician_id: clinician.id,
        client_group_id: clientGroup.id,
        status: "PENDING",
        amount: "100.00", // Use string for Decimal
        invoice_number: "INV-" + Date.now(),
        due_date: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Prepare payment data for full amount
    const paymentData = {
      invoice_id: invoice.id,
      amount: 100, // Full payment
      status: "COMPLETED",
    };

    // Make the API request
    const req = createRequestWithBody("/api/invoice/payment", paymentData);
    const response = await POST(req);

    // Verify response
    expect(response.status).toBe(201);

    // Verify invoice status in database
    const updatedInvoice = await prisma.invoice.findUnique({
      where: { id: invoice.id },
    });

    expect(updatedInvoice).not.toBeNull();
    expect(updatedInvoice?.status).toBe("PAID");
  });

  it("POST /api/invoice/payment should handle multiple partial payments correctly", async () => {
    // Create required related records
    const clinician = await ClinicianPrismaFactory.create();
    const clientGroup = await ClientGroupPrismaFactory.create();
    const client = await ClientPrismaFactory.create();

    // Create client group membership to link client and client group
    await prisma.clientGroupMembership.create({
      data: {
        client_group_id: clientGroup.id,
        client_id: client.id,
        role: "PRIMARY",
        is_contact_only: false,
        is_responsible_for_billing: true,
      },
    });

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        clinician_id: clinician.id,
        client_group_id: clientGroup.id,
        status: "PENDING",
        amount: "100.00", // Use string for Decimal
        invoice_number: "INV-" + Date.now(),
        due_date: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // First partial payment
    const firstPaymentData = {
      invoice_id: invoice.id,
      amount: 40,
      status: "COMPLETED",
    };

    const firstReq = createRequestWithBody(
      "/api/invoice/payment",
      firstPaymentData,
    );
    await POST(firstReq);

    // Check invoice status - should still be PENDING
    const checkInvoice = await prisma.invoice.findUnique({
      where: { id: invoice.id },
    });
    expect(checkInvoice?.status).toBe("PENDING");

    // Second partial payment that completes the invoice
    const secondPaymentData = {
      invoice_id: invoice.id,
      amount: 60,
      status: "COMPLETED",
    };

    const secondReq = createRequestWithBody(
      "/api/invoice/payment",
      secondPaymentData,
    );
    await POST(secondReq);

    // Verify invoice status in database - should now be PAID
    const updatedInvoice = await prisma.invoice.findUnique({
      where: { id: invoice.id },
    });

    expect(updatedInvoice).not.toBeNull();
    expect(updatedInvoice?.status).toBe("PAID");
  });
});
