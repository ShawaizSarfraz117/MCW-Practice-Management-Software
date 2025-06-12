import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { getClinicianInfo } from "@/utils/helpers";
import { generateUUID } from "@mcw/utils";

interface ProcessAcceptanceRequest {
  requestId: string;
  sharedDocumentTemplateIds: string[];
  clientDetails?: {
    legalFirstName: string;
    legalLastName: string;
    preferredName?: string;
    dateOfBirth?: string;
    email: string;
    phone: string;
  };
}

// POST - Process the acceptance of an appointment request
export async function POST(
  request: NextRequest,
  { params }: { params: { requestId: string } },
) {
  try {
    const { requestId } = params;
    const body: ProcessAcceptanceRequest = await request.json();
    const { sharedDocumentTemplateIds, clientDetails } = body;

    logger.info(
      { requestId, documentCount: sharedDocumentTemplateIds.length },
      "Processing appointment request acceptance",
    );

    const clinicianInfo = await getClinicianInfo();
    const clinicianId = clinicianInfo?.clinicianId ?? null;

    if (!clinicianId) {
      return NextResponse.json(
        { error: "Clinician not found" },
        { status: 401 },
      );
    }

    // Validate required fields
    if (
      !sharedDocumentTemplateIds ||
      !Array.isArray(sharedDocumentTemplateIds)
    ) {
      return NextResponse.json(
        { error: "sharedDocumentTemplateIds is required and must be an array" },
        { status: 400 },
      );
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch the appointment request
      const appointmentRequest = await tx.appointmentRequests.findUnique({
        where: { id: requestId },
        include: {
          RequestContactItems: true,
          PracticeService: true,
        },
      });

      if (!appointmentRequest) {
        throw new Error("Appointment request not found");
      }

      // Verify the request belongs to the clinician
      if (appointmentRequest.clinician_id !== clinicianId) {
        throw new Error("Unauthorized access to appointment request");
      }

      // Verify the request is still pending
      if (appointmentRequest.status !== "pending") {
        throw new Error("Appointment request is not in pending status");
      }

      let clientId: string;

      // 2. Handle client creation/retrieval
      if (appointmentRequest.client_id) {
        // Existing client
        clientId = appointmentRequest.client_id;
      } else if (appointmentRequest.RequestContactItems.length > 0) {
        // New client - create from contact items
        const contactItem = appointmentRequest.RequestContactItems[0];

        // Use provided client details or fall back to contact item data
        const newClientData = {
          id: generateUUID(),
          legal_first_name:
            clientDetails?.legalFirstName || contactItem.first_name,
          legal_last_name:
            clientDetails?.legalLastName || contactItem.last_name,
          preferred_name:
            clientDetails?.preferredName || contactItem.preferred_name,
          date_of_birth: clientDetails?.dateOfBirth
            ? new Date(clientDetails.dateOfBirth)
            : contactItem.date_of_birth,
          is_active: true,
          is_waitlist: false,
          primary_clinician_id: clinicianId,
          created_at: new Date(),
        };

        const newClient = await tx.client.create({
          data: newClientData,
        });

        clientId = newClient.id;

        // Create client contacts
        const contactsToCreate = [];

        if (clientDetails?.email || contactItem.email) {
          contactsToCreate.push({
            id: generateUUID(),
            client_id: clientId,
            contact_type: "email",
            type: "personal",
            value: clientDetails?.email || contactItem.email,
            is_primary: true,
            permission: "full",
          });
        }

        if (clientDetails?.phone || contactItem.phone) {
          contactsToCreate.push({
            id: generateUUID(),
            client_id: clientId,
            contact_type: "phone",
            type: "personal",
            value: clientDetails?.phone || contactItem.phone,
            is_primary: true,
            permission: "full",
          });
        }

        if (contactsToCreate.length > 0) {
          await tx.clientContact.createMany({
            data: contactsToCreate,
          });
        }

        // Create clinician-client relationship
        await tx.clinicianClient.create({
          data: {
            clinician_id: clinicianId,
            client_id: clientId,
          },
        });
      } else {
        throw new Error("No client information found for this request");
      }

      // 3. Create the appointment
      const appointmentId = generateUUID();
      await tx.appointment.create({
        data: {
          id: appointmentId,
          type: "appointment",
          title: `Appointment with ${appointmentRequest.PracticeService?.description || "Service"}`,
          is_all_day: false,
          start_date: appointmentRequest.start_time,
          end_date: appointmentRequest.end_time,
          created_by: clinicianId,
          status: "scheduled",
          clinician_id: clinicianId,
          service_id: appointmentRequest.service_id,
          appointment_fee: appointmentRequest.PracticeService?.rate || 0,
        },
      });

      // 4. Create survey answers for shared documents
      const surveyAnswersToCreate = sharedDocumentTemplateIds.map(
        (templateId) => ({
          id: generateUUID(),
          template_id: templateId,
          client_id: clientId,
          appointment_id: appointmentId,
          status: "sent",
          assigned_at: new Date(),
          expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          is_intake: false,
          is_signed: false,
          is_locked: false,
        }),
      );

      if (surveyAnswersToCreate.length > 0) {
        await tx.surveyAnswers.createMany({
          data: surveyAnswersToCreate,
        });
      }

      // 5. Update the appointment request status
      await tx.appointmentRequests.update({
        where: { id: requestId },
        data: {
          status: "accepted",
          updated_at: new Date(),
        },
      });

      return {
        appointmentId,
        clientId,
        documentsShared: sharedDocumentTemplateIds.length,
      };
    });

    logger.info(
      {
        requestId,
        appointmentId: result.appointmentId,
        clientId: result.clientId,
        documentsShared: result.documentsShared,
      },
      "Appointment request processed successfully",
    );

    return NextResponse.json({
      success: true,
      appointmentId: result.appointmentId,
      clientId: result.clientId,
      message: `Appointment request accepted successfully. ${result.documentsShared} documents shared with client.`,
    });
  } catch (error) {
    logger.error(
      { error, requestId: params?.requestId },
      "Error processing appointment request acceptance",
    );

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message === "Appointment request not found") {
        return NextResponse.json(
          { error: "Appointment request not found" },
          { status: 404 },
        );
      }
      if (error.message === "Unauthorized access to appointment request") {
        return NextResponse.json(
          { error: "Unauthorized access to appointment request" },
          { status: 403 },
        );
      }
      if (error.message === "Appointment request is not in pending status") {
        return NextResponse.json(
          { error: "Appointment request is not in pending status" },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to process appointment request acceptance" },
      { status: 500 },
    );
  }
}
