import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { backofficeAuthOptions } from "../auth/[...nextauth]/auth-options";
import { createAuditLog } from "@mcw/database";
import { z } from "zod";

// Define validation schema for audit request body
const auditSchema = z.object({
  event_type: z.string().min(1),
  event_text: z.string().min(1),
  client_id: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(backofficeAuthOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const result = auditSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: result.error.format(),
        },
        { status: 400 },
      );
    }

    const { event_type, event_text, client_id } = result.data;

    const audit = await createAuditLog({
      event_type,
      event_text,
      client_id,
      user_id: session.user.id,
    });

    return NextResponse.json(audit);
  } catch (error) {
    console.error("Error creating audit entry:", error);
    return NextResponse.json(
      { error: "Failed to create audit entry" },
      { status: 500 },
    );
  }
}
