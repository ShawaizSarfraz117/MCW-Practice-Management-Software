import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@mcw/utils/server";
import { prisma } from "@mcw/database";

export const dynamic = "force-dynamic";

// Define the activity type structure
interface ActivityRecord {
  Id: string;
  datetime: Date;
  event_type: string;
  event_text: string;
  user_id?: string;
  User?: {
    email: string;
  };
  Client?: {
    legal_first_name: string;
    legal_last_name: string;
  };
  ClientGroup?: {
    name: string;
  };
  is_hipaa: boolean;
  ip_address?: string;
  location?: string;
}

// Helper function to get activities from database
async function getActivities(options: {
  userId?: string;
  clientId?: string;
  timeRange?: string;
  fromDate?: string;
  toDate?: string;
  eventTypes?: string[];
  limit?: number;
  offset?: number;
}) {
  try {
    const where: Record<string, unknown> = {};

    // Filter by user if provided
    if (options.userId) {
      where.user_id = options.userId;
    }

    // Filter by client if provided
    if (options.clientId) {
      where.client_id = options.clientId;
    }

    // Handle time range
    if (options.timeRange === "custom" && options.fromDate && options.toDate) {
      // Handle custom date range
      const startDate = new Date(options.fromDate);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(options.toDate);
      endDate.setHours(23, 59, 59, 999);

      where.datetime = {
        gte: startDate,
        lte: endDate,
      };
    } else if (options.timeRange) {
      const now = new Date();
      let startDate = new Date();

      switch (options.timeRange) {
        case "1d":
          startDate.setDate(now.getDate() - 1);
          break;
        case "7d":
          startDate.setDate(now.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(now.getDate() - 30);
          break;
        case "90d":
          startDate.setDate(now.getDate() - 90);
          break;
        default:
          startDate = new Date(0); // All time
      }

      where.datetime = {
        gte: startDate,
        lte: now,
      };
    }

    // Filter by event types if provided
    if (options.eventTypes && options.eventTypes.length > 0) {
      where.event_type = {
        in: options.eventTypes,
      };
    }

    // Fetch activities with related data
    const [activities, total] = await Promise.all([
      prisma.audit.findMany({
        where,
        orderBy: { datetime: "desc" },
        take: options.limit || 50,
        skip: options.offset || 0,
        include: {
          User: {
            select: {
              email: true,
            },
          },
          Client: {
            select: {
              legal_first_name: true,
              legal_last_name: true,
            },
          },
          ClientGroup: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.audit.count({ where }),
    ]);

    return { activities, total };
  } catch (error) {
    console.error("Failed to fetch activities:", error);
    return { activities: [], total: 0 };
  }
}

// Helper function to get billing activities
async function getBillingActivities(options: {
  clientId?: string;
  limit?: number;
  offset?: number;
}) {
  return getActivities({
    ...options,
    eventTypes: ["INVOICE", "PAYMENT", "BILLING", "STATEMENT", "SUPERBILL"],
  });
}

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  // Check if requesting team members
  if (searchParams.get("type") === "team-members") {
    // Fetch all users who have either ADMIN or CLINICIAN roles
    const teamMembers = await prisma.user.findMany({
      where: {
        UserRole: {
          some: {
            Role: {
              name: {
                in: ["ADMIN", "CLINICIAN"],
              },
            },
          },
        },
      },
      include: {
        UserRole: {
          include: {
            Role: true,
          },
        },
        Clinician: true,
      },
      orderBy: {
        email: "asc",
      },
    });

    // Format the response
    const formattedMembers = teamMembers.map((member) => ({
      id: member.id,
      email: member.email,
      firstName: member.Clinician?.first_name || "",
      lastName: member.Clinician?.last_name || "",
      fullName: member.Clinician
        ? `${member.Clinician.first_name || ""} ${member.Clinician.last_name || ""}`.trim()
        : member.email,
      roles: member.UserRole.map((ur) => ur.Role.name),
    }));

    return NextResponse.json(formattedMembers);
  }

  // Regular activity fetching
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");
  const eventTypes = searchParams.get("types")?.split(",") || [];
  const timeRange = searchParams.get("timeRange") || undefined;
  const fromDate = searchParams.get("fromDate") || undefined;
  const toDate = searchParams.get("toDate") || undefined;
  const userId = searchParams.get("userId") || undefined;
  const clientId = searchParams.get("clientId") || undefined;
  const tab = searchParams.get("tab") || "history";

  let activities: ActivityRecord[], total: number;

  // Check if requesting billing activities
  if (tab === "billing" || searchParams.get("category") === "billing") {
    const result = await getBillingActivities({
      limit,
      offset,
      clientId,
    });
    activities = result.activities as ActivityRecord[];
    total = result.total;
  } else {
    // General activities
    const result = await getActivities({
      limit,
      offset,
      eventTypes: eventTypes.length > 0 ? eventTypes : undefined,
      timeRange,
      fromDate,
      toDate,
      userId,
    });
    activities = result.activities as ActivityRecord[];
    total = result.total;
  }

  // Format activities for display
  const formattedActivities = activities.map((activity) => {
    // Parse details from event_text if it contains JSON
    let details = {};
    try {
      const colonIndex = activity.event_text.indexOf(":");
      if (colonIndex > -1) {
        const jsonPart = activity.event_text.substring(colonIndex + 1).trim();
        details = JSON.parse(jsonPart);
      }
    } catch (_e) {
      // If parsing fails, use empty object
    }

    // Extract entity type and action from event_type
    const [entityType, action] = activity.event_type
      ?.toLowerCase()
      .split("_") || ["unknown", "unknown"];

    // Different formatting for billing vs general activities
    if (tab === "billing" || searchParams.get("category") === "billing") {
      return {
        id: activity.Id,
        type: entityType,
        action: action,
        timestamp: activity.datetime,
        performedBy: activity.user_id,
        performedByName: activity.User ? activity.User.email : "System",
        clientName: activity.Client
          ? `${activity.Client.legal_first_name} ${activity.Client.legal_last_name}`
          : null,
        description: activity.event_text,
        metadata: details,
      };
    } else {
      return {
        id: activity.Id,
        datetime: activity.datetime,
        event_type: activity.event_type,
        event_text: activity.event_text,
        User: activity.User
          ? {
              email: activity.User.email,
            }
          : null,
        Client: activity.Client
          ? {
              legal_first_name: activity.Client.legal_first_name,
              legal_last_name: activity.Client.legal_last_name,
            }
          : null,
        ClientGroup: activity.ClientGroup
          ? {
              name: activity.ClientGroup.name,
            }
          : null,
        is_hipaa: activity.is_hipaa,
        ip_address: activity.ip_address,
        location: activity.location,
      };
    }
  });

  return NextResponse.json({
    activities: formattedActivities,
    total,
    limit,
    offset,
  });
});
