import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { Prisma } from "@prisma/client";
import { getClinicianInfo } from "@/utils/helpers";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "name";
    const status = searchParams.get("status");
    const includeProfile = searchParams.get("includeProfile");
    const includeAdress = searchParams.get("includeAdress");
    const { clinicianId } = await getClinicianInfo();
    // Parse status parameter (could be a comma-separated list)
    const statusArray = status ? status.split(",") : ["all"];

    // Validate the sortBy field - only allow fields that exist in ClientGroup
    // or special cases for first_name and last_name
    const validSortFields = ["id", "name", "type"];
    let validatedSortField = validSortFields.includes(sortBy) ? sortBy : "name";
    let needNameSplit = false;

    // Handle special cases for first_name and last_name
    if (sortBy === "first_name" || sortBy === "last_name") {
      validatedSortField = "name"; // We'll split this field later
      needNameSplit = true;
    }

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    if (id) {
      logger.info(`Retrieving client group with id: ${id}`);
      const clientGroup = await prisma.clientGroup.findUnique({
        where: { id },
        include: {
          ClientGroupMembership: {
            include: {
              Client: {
                include: {
                  ClientContact: true,
                  ClientProfile: includeProfile === "true",
                  ClientAdress: includeAdress === "true",
                },
              },
            },
          },
        },
      });

      if (!clientGroup) {
        return NextResponse.json(
          { error: "Client group not found" },
          { status: 404 },
        );
      }

      // Return consistent paginated format even for single items
      return NextResponse.json({
        data: [clientGroup],
        pagination: {
          page: 1,
          limit: 1,
          total: 1,
        },
      });
    } else {
      logger.info("Retrieving all client groups with pagination");

      let whereCondition: Prisma.ClientGroupWhereInput = {};

      // Add search condition if search query exists
      if (search) {
        const searchTerm = search.toLowerCase();
        whereCondition = {
          OR: [
            { name: { contains: searchTerm } },
            { type: { contains: searchTerm } },
          ],
        };
      }

      // Add status filtering for clients in the group
      if (statusArray.length > 0 && !statusArray.includes("all")) {
        // Create status filter condition for nested clients
        const statusFilter: Prisma.ClientGroupWhereInput = {
          ClientGroupMembership: {
            some: {
              Client: {
                OR: statusArray.map((status) => {
                  switch (status) {
                    case "active":
                      return { is_active: true };
                    case "inactive":
                      return { is_active: false };
                    case "waitlist":
                      return {
                        ClientGroupMembership: {
                          some: {
                            Client: {
                              is_waitlist: true,
                            },
                          },
                        },
                      };
                    case "contacts":
                      return {
                        ClientGroupMembership: {
                          some: {
                            is_contact_only: true,
                          },
                        },
                      };
                    default:
                      return {};
                  }
                }),
              },
            },
          },
        };

        // Combine with existing where conditions
        whereCondition = {
          ...whereCondition,
          ...statusFilter,
        };
      }
      if (clinicianId) {
        whereCondition = {
          ...whereCondition,
          ...{
            clinician_id: clinicianId,
          },
        };
      }

      const clientGroups = await prisma.clientGroup.findMany({
        where: whereCondition,
        orderBy: {
          [validatedSortField]: "asc",
        },
        skip,
        take: limit,
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
      });

      const total = await prisma.clientGroup.count({ where: whereCondition });

      // Sort by first_name or last_name if needed
      const sortedGroups = [...clientGroups];
      if (needNameSplit) {
        sortedGroups.sort((a, b) => {
          const aNameParts = a.name.split(" ");
          const bNameParts = b.name.split(" ");

          if (sortBy === "first_name") {
            return aNameParts[0].localeCompare(bNameParts[0]);
          } else {
            // last_name
            const aLastName =
              aNameParts.length > 1 ? aNameParts[aNameParts.length - 1] : "";
            const bLastName =
              bNameParts.length > 1 ? bNameParts[bNameParts.length - 1] : "";
            return aLastName.localeCompare(bLastName);
          }
        });
      }

      return NextResponse.json({
        data: sortedGroups,
        pagination: {
          page,
          limit,
          total,
        },
      });
    }
  } catch (error) {
    console.error("Error fetching client groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch client groups" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { id } = data;

    if (!id) {
      return NextResponse.json(
        { error: "Client Group ID is required" },
        { status: 400 },
      );
    }

    // Format the date properly for Prisma (if provided)
    let formattedDate = undefined;
    if (data.dateFirstSeen) {
      // Convert YYYY-MM-DD to ISO date by adding time
      formattedDate = new Date(`${data.dateFirstSeen}T00:00:00Z`).toISOString();
    }

    await prisma.clientGroup.update({
      where: { id },
      data: {
        is_active: data.status === "Active",
        first_seen_at: formattedDate,
        notes: data.notes,
      },
    });

    return NextResponse.json(
      { message: "Client Group updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating client group:", error);
    return NextResponse.json(
      { error: "Failed to update client group" },
      { status: 500 },
    );
  }
}
