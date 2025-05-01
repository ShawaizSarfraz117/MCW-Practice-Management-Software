/* eslint-disable max-lines-per-function */
import { describe, it, expect, afterEach } from "vitest";
import { prisma } from "@mcw/database";
import { createRequestWithBody } from "@mcw/utils";
import {
  CreditCardPrismaFactory,
  ClientGroupPrismaFactory,
  ClientPrismaFactory,
  ClinicianPrismaFactory,
} from "@mcw/database/mock-data";
import { POST } from "@/api/invoice/payment/route";

// Helper function to clean up all test data created in a payment test
async function cleanupPaymentTestData({
  paymentIds,
  invoiceIds,
  creditCardIds,
  clientIds,
  clientGroupIds,
  clinicianIds,
}: {
  paymentIds: string[];
  invoiceIds: string[];
  creditCardIds: string[];
  clientIds: string[];
  clientGroupIds: string[];
  clinicianIds: string[];
}) {
  try {
    // Delete in reverse order of creation / dependency
    if (paymentIds.length > 0 && paymentIds.every((id) => id)) {
      await prisma.payment.deleteMany({ where: { id: { in: paymentIds } } });
    }
    if (invoiceIds.length > 0) {
      await prisma.invoice.deleteMany({ where: { id: { in: invoiceIds } } });
    }
    if (creditCardIds.length > 0) {
      await prisma.creditCard.deleteMany({
        where: { id: { in: creditCardIds } },
      });
    }
    if (clientIds.length > 0 || clientGroupIds.length > 0) {
      // Need to delete memberships linking clients and groups first
      await prisma.clientGroupMembership.deleteMany({
        where: {
          OR: [
            { client_id: { in: clientIds } },
            { client_group_id: { in: clientGroupIds } },
          ],
        },
      });
    }
    if (clientIds.length > 0) {
      await prisma.clientReminderPreference.deleteMany({
        where: { client_id: { in: clientIds } },
      });
      await prisma.clientContact.deleteMany({
        where: { client_id: { in: clientIds } },
      });
      await prisma.clinicianClient.deleteMany({
        where: { client_id: { in: clientIds } },
      });
      await prisma.client.deleteMany({ where: { id: { in: clientIds } } });
    }
    if (clientGroupIds.length > 0) {
      await prisma.clientGroup.deleteMany({
        where: { id: { in: clientGroupIds } },
      });
    }
    if (clinicianIds.length > 0) {
      const clinicians = await prisma.clinician.findMany({
        where: { id: { in: clinicianIds } },
        select: { id: true, user_id: true },
      });
      const userIds = clinicians
        .map((c) => c.user_id)
        .filter((id): id is string => id !== null);

      await prisma.clinicianClient.deleteMany({
        where: { clinician_id: { in: clinicianIds } },
      });
      await prisma.clinicianLocation.deleteMany({
        where: { clinician_id: { in: clinicianIds } },
      });
      await prisma.clinicianServices.deleteMany({
        where: { clinician_id: { in: clinicianIds } },
      });
      await prisma.clinician.deleteMany({
        where: { id: { in: clinicianIds } },
      });

      if (userIds.length > 0) {
        await prisma.userRole.deleteMany({
          where: { user_id: { in: userIds } },
        });
        await prisma.user.deleteMany({ where: { id: { in: userIds } } });
      }
    }
  } catch (error) {
    console.error("Error cleaning up payment test data:", error);
  }
}

describe("Invoice Payment API Integration Tests", async () => {
  let createdPaymentIds: string[] = [];
  let createdInvoiceIds: string[] = [];
  let createdCreditCardIds: string[] = [];
  let createdClientIds: string[] = [];
  let createdClientGroupIds: string[] = [];
  let createdClinicianIds: string[] = [];

  afterEach(async () => {
    await cleanupPaymentTestData({
      paymentIds: createdPaymentIds,
      invoiceIds: createdInvoiceIds,
      creditCardIds: createdCreditCardIds,
      clientIds: createdClientIds,
      clientGroupIds: createdClientGroupIds,
      clinicianIds: createdClinicianIds,
    });
    // Reset arrays
    createdPaymentIds = [];
    createdInvoiceIds = [];
    createdCreditCardIds = [];
    createdClientIds = [];
    createdClientGroupIds = [];
    createdClinicianIds = [];
  });

  it("POST /api/invoice/payment should create a new payment", async () => {
    // Create required related records
    const clinician = await ClinicianPrismaFactory.create();
    const clientGroup = await ClientGroupPrismaFactory.create();
    const client = await ClientPrismaFactory.create();
    createdClinicianIds.push(clinician.id);
    createdClientGroupIds.push(clientGroup.id);
    createdClientIds.push(client.id);

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
    createdCreditCardIds.push(creditCard.id);

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        clinician_id: clinician.id,
        client_group_id: clientGroup.id,
        status: "PENDING",
        type: "INVOICE",
        amount: "100.00", // Use string for Decimal
        invoice_number: "INV-" + Date.now(),
        due_date: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    createdInvoiceIds.push(invoice.id);

    // Prepare payment data - format to match API expectations
    const paymentData = {
      invoiceWithPayment: [
        {
          id: invoice.id,
          amount: 75,
        },
      ],
      client_group_id: clientGroup.id,
      status: "COMPLETED",
      transaction_id: "tx_" + Date.now(),
      response: "Payment successful",
    };

    console.log("TEST 1 - Payment data:", JSON.stringify(paymentData));

    // Make the API request
    const req = createRequestWithBody("/api/invoice/payment", paymentData);
    const response = await POST(req);

    // Log the response for debugging
    console.log("TEST 1 - Response status:", response.status);
    const responseText = await response.text();
    console.log("TEST 1 - Response text:", responseText);
    const responseData = JSON.parse(responseText);

    // Verify response
    expect(response.status).toBe(201);

    // Store created payment ID (first one in array)
    createdPaymentIds.push(responseData[0]?.id);

    expect(responseData[0]).toHaveProperty("id");
    expect(responseData[0]).toHaveProperty("invoice_id", invoice.id);
    expect(responseData[0]).toHaveProperty(
      "amount",
      "75", // API returns string for decimal amounts
    );
    expect(responseData[0]).toHaveProperty("status", paymentData.status);

    // Verify database state
    const paymentInDb = await prisma.payment.findUnique({
      where: { id: responseData[0]?.id },
    });
    expect(paymentInDb).not.toBeNull();
    expect(paymentInDb?.invoice_id).toBe(invoice.id);
    expect(paymentInDb?.amount.toString()).toBe("75");
  });

  it("POST /api/invoice/payment should update invoice status to PAID when fully paid", async () => {
    // Create required related records
    const clinician = await ClinicianPrismaFactory.create();
    const clientGroup = await ClientGroupPrismaFactory.create();
    const client = await ClientPrismaFactory.create();
    createdClinicianIds.push(clinician.id);
    createdClientGroupIds.push(clientGroup.id);
    createdClientIds.push(client.id);

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
        type: "INVOICE",
        amount: "100.00", // Use string for Decimal
        invoice_number: "INV-" + Date.now(),
        due_date: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    createdInvoiceIds.push(invoice.id);

    // Prepare payment data for full amount
    const paymentData = {
      invoiceWithPayment: [
        {
          id: invoice.id,
          amount: 100,
        },
      ],
      client_group_id: clientGroup.id,
      status: "COMPLETED",
      transaction_id: "tx_" + Date.now(),
      response: "Payment successful",
    };

    console.log("TEST 2 - Payment data:", JSON.stringify(paymentData));

    // Make the API request
    const req = createRequestWithBody("/api/invoice/payment", paymentData);
    const response = await POST(req);

    // Log the response
    console.log("TEST 2 - Response status:", response.status);
    const responseText = await response.text();
    console.log("TEST 2 - Response text:", responseText);
    const responseData = JSON.parse(responseText);

    // Verify response
    expect(response.status).toBe(201);
    createdPaymentIds.push(responseData[0]?.id);

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
    createdClinicianIds.push(clinician.id);
    createdClientGroupIds.push(clientGroup.id);
    createdClientIds.push(client.id);

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
        type: "INVOICE",
        amount: "100.00", // Use string for Decimal
        invoice_number: "INV-" + Date.now(),
        due_date: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    createdInvoiceIds.push(invoice.id);

    // First partial payment
    const firstPaymentData = {
      invoiceWithPayment: [
        {
          id: invoice.id,
          amount: 40,
        },
      ],
      client_group_id: clientGroup.id,
      status: "COMPLETED",
      transaction_id: "tx_" + Date.now(),
      response: "First payment",
    };

    console.log(
      "TEST 3 - First payment data:",
      JSON.stringify(firstPaymentData),
    );

    const firstReq = createRequestWithBody(
      "/api/invoice/payment",
      firstPaymentData,
    );
    const firstResponse = await POST(firstReq);

    // Log the first response
    console.log("TEST 3 - First response status:", firstResponse.status);
    const firstResponseText = await firstResponse.text();
    console.log("TEST 3 - First response text:", firstResponseText);
    const firstPayment = JSON.parse(firstResponseText);

    expect(firstResponse.status).toBe(201);
    createdPaymentIds.push(firstPayment[0]?.id);

    // Check invoice status - should still be PENDING
    const checkInvoice = await prisma.invoice.findUnique({
      where: { id: invoice.id },
    });
    expect(checkInvoice?.status).toBe("PENDING");

    // Second partial payment that completes the invoice
    const secondPaymentData = {
      invoiceWithPayment: [
        {
          id: invoice.id,
          amount: 60,
        },
      ],
      client_group_id: clientGroup.id,
      status: "COMPLETED",
      transaction_id: "tx_" + Date.now(),
      response: "Second payment",
    };

    console.log(
      "TEST 3 - Second payment data:",
      JSON.stringify(secondPaymentData),
    );

    const secondReq = createRequestWithBody(
      "/api/invoice/payment",
      secondPaymentData,
    );
    const secondResponse = await POST(secondReq);

    // Log the second response
    console.log("TEST 3 - Second response status:", secondResponse.status);
    const secondResponseText = await secondResponse.text();
    console.log("TEST 3 - Second response text:", secondResponseText);
    const secondPayment = JSON.parse(secondResponseText);

    expect(secondResponse.status).toBe(201);
    createdPaymentIds.push(secondPayment[0]?.id);

    // Verify invoice status in database - should now be PAID
    const updatedInvoice = await prisma.invoice.findUnique({
      where: { id: invoice.id },
    });

    expect(updatedInvoice).not.toBeNull();
    expect(updatedInvoice?.status).toBe("PAID");
  });
});
