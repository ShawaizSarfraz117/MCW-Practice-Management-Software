/* eslint-disable max-lines-per-function */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { getClinicianInfo } from "@/utils/helpers";
import { Prisma } from "@prisma/client";

// Define proper types for the where conditions
type AppointmentRequestsWhereInput = Prisma.AppointmentRequestsWhereInput;

// GET - Retrieve appointment requests with filtering
export async function GET(request: NextRequest) {
  try {
    logger.info("Fetching appointment requests");

    const clinicianInfo = await getClinicianInfo();
    const clinicianId = clinicianInfo?.clinicianId ?? null;

    if (!clinicianId) {
      return NextResponse.json(
        { error: "Clinician not found" },
        { status: 401 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const tab = searchParams.get("tab") || "pending";
    const clientStatus = searchParams.get("clientStatus");
    const location = searchParams.get("location");
    const requestSource = searchParams.get("requestSource");
    const documentStatus = searchParams.get("documentStatus");
    const expiringSoon = searchParams.get("expiringSoon") === "true";

    // Build where condition with proper typing
    let whereCondition: AppointmentRequestsWhereInput = {
      clinician_id: clinicianId,
    };

    // Filter by tab (status)
    if (tab === "pending") {
      whereCondition.status = "pending";
    } else if (tab === "archived") {
      whereCondition.status = "archived";
    }

    // Apply additional filters
    const additionalFilters: AppointmentRequestsWhereInput[] = [];

    // Client status filter
    if (clientStatus) {
      if (clientStatus === "prospective") {
        additionalFilters.push({
          OR: [
            { client_id: null }, // New clients (no existing client record)
            {
              client_id: {
                in: await prisma.client
                  .findMany({
                    where: {
                      is_active: false,
                      is_waitlist: false,
                      ClinicianClient: {
                        some: {
                          clinician_id: clinicianId,
                        },
                      },
                    },
                    select: { id: true },
                  })
                  .then((clients) => clients.map((c) => c.id)),
              },
            },
          ],
        });
      } else if (clientStatus === "active") {
        additionalFilters.push({
          client_id: {
            in: await prisma.client
              .findMany({
                where: {
                  is_active: true,
                  ClinicianClient: {
                    some: {
                      clinician_id: clinicianId,
                    },
                  },
                },
                select: { id: true },
              })
              .then((clients) => clients.map((c) => c.id)),
          },
        });
      }
    }

    // Document status filter (based on related SurveyAnswers)
    if (documentStatus) {
      if (documentStatus === "incomplete") {
        additionalFilters.push({
          client_id: {
            in: await prisma.client
              .findMany({
                where: {
                  SurveyAnswers: {
                    some: {
                      OR: [
                        { status: "sent" },
                        { status: "pending" },
                        { status: "in_progress" },
                        {
                          AND: [
                            { content: null },
                            { status: { not: "completed" } },
                          ],
                        },
                      ],
                    },
                  },
                  ClinicianClient: {
                    some: {
                      clinician_id: clinicianId,
                    },
                  },
                },
                select: { id: true },
              })
              .then((clients) => clients.map((c) => c.id)),
          },
        });
      } else if (documentStatus === "completed") {
        additionalFilters.push({
          client_id: {
            in: await prisma.client
              .findMany({
                where: {
                  SurveyAnswers: {
                    some: {
                      status: "completed",
                    },
                  },
                  ClinicianClient: {
                    some: {
                      clinician_id: clinicianId,
                    },
                  },
                },
                select: { id: true },
              })
              .then((clients) => clients.map((c) => c.id)),
          },
        });
      }
    }

    // Expiring soon filter
    if (expiringSoon) {
      const currentDate = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(currentDate.getDate() + 30);

      additionalFilters.push({
        client_id: {
          in: await prisma.client
            .findMany({
              where: {
                SurveyAnswers: {
                  some: {
                    expiry_date: {
                      lte: thirtyDaysFromNow,
                      gte: currentDate,
                    },
                    status: {
                      not: "completed",
                    },
                  },
                },
                ClinicianClient: {
                  some: {
                    clinician_id: clinicianId,
                  },
                },
              },
              select: { id: true },
            })
            .then((clients) => clients.map((c) => c.id)),
        },
      });
    }

    // Combine all filters
    if (additionalFilters.length > 0) {
      whereCondition = {
        AND: [whereCondition, ...additionalFilters],
      };
    }

    // Fetch appointment requests
    const appointmentRequests = await prisma.appointmentRequests.findMany({
      where: whereCondition,
      include: {
        PracticeService: {
          select: {
            id: true,
            description: true,
            duration: true,
          },
        },
        RequestContactItems: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            date_of_birth: true,
            type: true,
          },
        },
      },
      orderBy: {
        received_date: "desc",
      },
    });

    // Fetch client information separately for requests that have client_id
    const clientIds = appointmentRequests
      .map((req) => req.client_id)
      .filter((id): id is string => id !== null);

    const clients =
      clientIds.length > 0
        ? await prisma.client.findMany({
            where: {
              id: { in: clientIds },
            },
            select: {
              id: true,
              legal_first_name: true,
              legal_last_name: true,
              date_of_birth: true,
              is_active: true,
              is_waitlist: true,
            },
          })
        : [];

    // Create a map for quick client lookup
    const clientMap = new Map(clients.map((client) => [client.id, client]));

    // Transform the data to match the expected response format
    const transformedRequests = appointmentRequests.map((request) => {
      // Determine client information
      let clientInfo;
      let isNewClient = false;

      const client = request.client_id
        ? clientMap.get(request.client_id)
        : null;

      if (client) {
        // Existing client
        const age = client.date_of_birth
          ? new Date().getFullYear() -
            new Date(client.date_of_birth).getFullYear()
          : null;

        let clientType = "Active";
        if (!client.is_active && client.is_waitlist) {
          clientType = "Waitlist";
        } else if (!client.is_active) {
          clientType = "Prospective";
        }

        clientInfo = {
          name: `${client.legal_first_name} ${client.legal_last_name}`,
          age,
          type: clientType,
          clientId: client.id,
        };
      } else if (request.RequestContactItems.length > 0) {
        // New client from contact items
        const contactItem = request.RequestContactItems[0];
        const age = contactItem.date_of_birth
          ? new Date().getFullYear() -
            new Date(contactItem.date_of_birth).getFullYear()
          : null;

        clientInfo = {
          name: `${contactItem.first_name} ${contactItem.last_name}`,
          age,
          type: "New Client",
        };
        isNewClient = true;
      } else {
        clientInfo = {
          name: "Unknown",
          age: null,
          type: "Unknown",
        };
      }

      return {
        id: request.id,
        client: clientInfo,
        appointmentDetails: {
          dateTime: request.start_time.toISOString(),
          duration: request.PracticeService?.duration || 60,
          serviceName:
            request.PracticeService?.description || "Unknown Service",
        },
        status: request.status,
        dateReceived: request.received_date.toISOString(),
        isNewClient,
      };
    });

    logger.info(
      {
        requestCount: transformedRequests.length,
        filters: {
          tab,
          clientStatus,
          location,
          requestSource,
          documentStatus,
          expiringSoon,
        },
      },
      "Appointment requests retrieved successfully",
    );

    return NextResponse.json(transformedRequests);
  } catch (error) {
    logger.error({ error }, "Error fetching appointment requests");
    return NextResponse.json(
      { error: "Failed to fetch appointment requests" },
      { status: 500 },
    );
  }
}
