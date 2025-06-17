import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@mcw/utils";
import { prisma } from "@mcw/database";
import { getBackOfficeSession } from "@/utils/helpers";
import { logger } from "@mcw/logger";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await getBackOfficeSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");

  if (!clientId) {
    return NextResponse.json(
      { error: "Client ID is required" },
      { status: 400 },
    );
  }

  try {
    const portalPermission = await prisma.clientPortalPermission.findUnique({
      where: {
        client_id: clientId,
      },
    });

    return NextResponse.json({ data: portalPermission });
  } catch (error) {
    logger.error({
      message: "Error fetching client portal permission",
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to fetch client portal permission" },
      { status: 500 },
    );
  }
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await getBackOfficeSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    client_id,
    email,
    allow_appointment_requests = true,
    use_secure_messaging = true,
    access_billing_documents = true,
    receive_announcements = true,
    subject,
    message,
  } = body;

  if (!client_id || !email) {
    return NextResponse.json(
      { error: "Client ID and email are required" },
      { status: 400 },
    );
  }

  try {
    // Check if permission already exists
    const existingPermission = await prisma.clientPortalPermission.findUnique({
      where: {
        client_id,
      },
    });

    if (existingPermission) {
      return NextResponse.json(
        { error: "Client portal permission already exists" },
        { status: 409 },
      );
    }

    // Create new permission
    const portalPermission = await prisma.clientPortalPermission.create({
      data: {
        client_id,
        email,
        allow_appointment_requests,
        use_secure_messaging,
        access_billing_documents,
        receive_announcements,
      },
    });

    logger.info({
      message: "Client portal permission created successfully",
      client_id,
      email,
    });

    // Send invitation email if subject and message are provided
    if (subject && message) {
      try {
        // Send email using the email API
        const emailResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || ""}/api/email/send`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Cookie: request.headers.get("cookie") || "",
            },
            body: JSON.stringify({
              to: email,
              subject,
              html: message,
              text: message.replace(/<[^>]*>/g, ""), // Strip HTML for text version
            }),
          },
        );

        if (!emailResponse.ok) {
          logger.error({
            message: "Failed to send portal invitation email",
            client_id,
            email,
            status: emailResponse.status,
          });
          // Don't fail the whole request if email fails
        } else {
          logger.info({
            message: "Portal invitation email sent successfully",
            client_id,
            email,
          });
        }
      } catch (emailError) {
        logger.error({
          message: "Error sending portal invitation email",
          error:
            emailError instanceof Error
              ? emailError.message
              : String(emailError),
          client_id,
          email,
        });
        // Don't fail the whole request if email fails
      }
    }

    return NextResponse.json({ data: portalPermission });
  } catch (error) {
    console.log("🚀 ~ POST ~ error:", error);
    logger.error({
      message: "Error creating client portal permission",
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: error }, { status: 500 });
  }
});

export const PUT = withErrorHandling(async (request: NextRequest) => {
  const session = await getBackOfficeSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    client_id,
    email,
    allow_appointment_requests,
    use_secure_messaging,
    access_billing_documents,
    receive_announcements,
    is_active,
    subject,
    message,
    resend_email,
  } = body;

  if (!client_id) {
    return NextResponse.json(
      { error: "Client ID is required" },
      { status: 400 },
    );
  }

  try {
    const portalPermission = await prisma.clientPortalPermission.update({
      where: {
        client_id,
      },
      data: {
        ...(email !== undefined && { email }),
        ...(allow_appointment_requests !== undefined && {
          allow_appointment_requests,
        }),
        ...(use_secure_messaging !== undefined && { use_secure_messaging }),
        ...(access_billing_documents !== undefined && {
          access_billing_documents,
        }),
        ...(receive_announcements !== undefined && { receive_announcements }),
        ...(is_active !== undefined && { is_active }),
      },
    });

    logger.info({
      message: "Client portal permission updated successfully",
      client_id,
      updated_fields: Object.keys(body).filter((key) => key !== "client_id"),
    });

    // Send invitation email if resend is requested and subject/message are provided
    if (resend_email && subject && message) {
      try {
        const emailToUse = portalPermission.email || email;

        // Send email using the email API
        const emailResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || ""}/api/email/send`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Cookie: request.headers.get("cookie") || "",
            },
            body: JSON.stringify({
              to: emailToUse,
              subject,
              html: message,
              text: message.replace(/<[^>]*>/g, ""), // Strip HTML for text version
            }),
          },
        );

        if (!emailResponse.ok) {
          logger.error({
            message: "Failed to resend portal invitation email",
            client_id,
            email: emailToUse,
            status: emailResponse.status,
          });
          // Don't fail the whole request if email fails
        } else {
          logger.info({
            message: "Portal invitation email resent successfully",
            client_id,
            email: emailToUse,
          });
        }
      } catch (emailError) {
        logger.error({
          message: "Error resending portal invitation email",
          error:
            emailError instanceof Error
              ? emailError.message
              : String(emailError),
          client_id,
        });
        // Don't fail the whole request if email fails
      }
    }

    return NextResponse.json({ data: portalPermission });
  } catch (error) {
    logger.error({
      message: "Error updating client portal permission",
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to update client portal permission" },
      { status: 500 },
    );
  }
});

export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const session = await getBackOfficeSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");

  if (!clientId) {
    return NextResponse.json(
      { error: "Client ID is required" },
      { status: 400 },
    );
  }

  try {
    // Delete the portal permission
    await prisma.clientPortalPermission.delete({
      where: {
        client_id: clientId,
      },
    });

    logger.info({
      message: "Client portal permission deleted successfully",
      client_id: clientId,
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    logger.error({
      message: "Error deleting client portal permission",
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to delete client portal permission" },
      { status: 500 },
    );
  }
});
