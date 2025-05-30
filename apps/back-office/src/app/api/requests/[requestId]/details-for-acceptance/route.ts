import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { getClinicianInfo } from "@/utils/helpers";

// GET - Retrieve appointment request details and available documents for acceptance
export async function GET(
  _request: NextRequest,
  { params }: { params: { requestId: string } },
) {
  try {
    const { requestId } = params;
    logger.info(
      { requestId },
      "Fetching appointment request details for acceptance",
    );

    const clinicianInfo = await getClinicianInfo();
    const clinicianId = clinicianInfo?.clinicianId ?? null;

    if (!clinicianId) {
      return NextResponse.json(
        { error: "Clinician not found" },
        { status: 401 },
      );
    }

    // Fetch the appointment request with related data
    const appointmentRequest = await prisma.appointmentRequests.findUnique({
      where: { id: requestId },
      include: {
        Client: {
          select: {
            id: true,
            legal_first_name: true,
            legal_last_name: true,
            ClientContact: {
              where: {
                OR: [{ contact_type: "email" }, { contact_type: "phone" }],
              },
              select: {
                contact_type: true,
                value: true,
                is_primary: true,
              },
            },
          },
        },
        RequestContactItems: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
            type: true,
          },
        },
        PracticeService: {
          select: {
            id: true,
            name: true,
            duration: true,
          },
        },
      },
    });

    if (!appointmentRequest) {
      return NextResponse.json(
        { error: "Appointment request not found" },
        { status: 404 },
      );
    }

    // Verify the request belongs to the clinician
    if (appointmentRequest.clinician_id !== clinicianId) {
      return NextResponse.json(
        { error: "Unauthorized access to appointment request" },
        { status: 403 },
      );
    }

    // Fetch available document templates
    const availableDocuments = await prisma.surveyTemplate.findMany({
      where: {
        is_active: true,
        is_shareable: true,
      },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Prepare client information
    let clientInfo;
    if (appointmentRequest.Client) {
      // Existing client
      const primaryEmail =
        appointmentRequest.Client.ClientContact.find(
          (contact) => contact.contact_type === "email" && contact.is_primary,
        )?.value ||
        appointmentRequest.Client.ClientContact.find(
          (contact) => contact.contact_type === "email",
        )?.value;

      const primaryPhone =
        appointmentRequest.Client.ClientContact.find(
          (contact) => contact.contact_type === "phone" && contact.is_primary,
        )?.value ||
        appointmentRequest.Client.ClientContact.find(
          (contact) => contact.contact_type === "phone",
        )?.value;

      clientInfo = {
        name: `${appointmentRequest.Client.legal_first_name} ${appointmentRequest.Client.legal_last_name}`,
        email: primaryEmail || "",
        phone: primaryPhone || "",
        isNewClient: false,
        clientId: appointmentRequest.Client.id,
      };
    } else if (appointmentRequest.RequestContactItems.length > 0) {
      // New client from contact items
      const contactItem = appointmentRequest.RequestContactItems[0];
      clientInfo = {
        name: `${contactItem.first_name} ${contactItem.last_name}`,
        email: contactItem.email,
        phone: contactItem.phone,
        isNewClient: true,
        contactItemId: contactItem.id,
      };
    } else {
      return NextResponse.json(
        { error: "No client information found for this request" },
        { status: 400 },
      );
    }

    const response = {
      appointmentRequest: {
        id: appointmentRequest.id,
        clientInfo,
        appointmentDetails: {
          dateTime: appointmentRequest.start_time.toISOString(),
          serviceName:
            appointmentRequest.PracticeService?.name || "Unknown Service",
          duration: appointmentRequest.PracticeService?.duration || 60,
        },
        status: appointmentRequest.status,
        reasonsForCare: appointmentRequest.reasons_for_seeking_care,
        mentalHealthHistory: appointmentRequest.mental_health_history,
        additionalNotes: appointmentRequest.additional_notes,
      },
      availableDocuments: availableDocuments.map((doc) => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        description: doc.description,
      })),
    };

    logger.info(
      { requestId, clientInfo: clientInfo.isNewClient ? "new" : "existing" },
      "Appointment request details retrieved successfully",
    );

    return NextResponse.json(response);
  } catch (error) {
    logger.error(
      { error, requestId: params?.requestId },
      "Error fetching appointment request details",
    );
    return NextResponse.json(
      { error: "Failed to fetch appointment request details" },
      { status: 500 },
    );
  }
}
