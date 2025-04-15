import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { backofficeAuthOptions } from "../auth/[...nextauth]/auth-options";
import { createAuditLog } from "@mcw/utils";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(backofficeAuthOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { event_type, event_text, client_id } = await request.json();

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
