import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "datetime";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Get the authenticated user
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const skip = (page - 1) * limit;

    // Build the where clause for search
    const where = {
      event_type: 'History events',
      ...(search ? {
        OR: [
          { event_text: { contains: search } },
          { User: { email: { contains: search } } },
          { Client: { 
              OR: [
                { legal_first_name: { contains: search } },
                { legal_last_name: { contains: search } }
              ]
          } }
        ],
      } : {})
    };

    // Fetch history entries with related data
    const [history, total] = await Promise.all([
      prisma.audit.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          User: {
            select: {
              email: true,
              Clinician: {
                select: {
                  first_name: true,
                  last_name: true,
                }
              }
            }
          },
          Client: {
            select: {
              legal_first_name: true,
              legal_last_name: true,
            }
          }
        }
      }),
      prisma.audit.count({ where })
    ]);

    // Format the data for the frontend
    const formattedHistory = history.map(entry => ({
      id: entry.Id,
      date: entry.datetime.toLocaleDateString(),
      time: entry.datetime.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZoneName: 'short' 
      }),
      event: entry.event_text,
      user_id: entry.user_id,
      username: entry.User ? 
        (entry.User.Clinician ? 
          `${entry.User.Clinician.first_name} ${entry.User.Clinician.last_name}` : 
          entry.User.email) : 
        'System',
      client_name: entry.Client ? 
        `${entry.Client.legal_first_name} ${entry.Client.legal_last_name}` : 
        null
    }));

    return NextResponse.json({
      data: formattedHistory,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    });

  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
} 