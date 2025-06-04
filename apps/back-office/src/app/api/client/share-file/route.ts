import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { getBackOfficeSession, getClinicianInfo } from "@/utils/helpers";
import { generateUUID } from "@mcw/utils";

interface FileSharePayload {
  client_group_id: string;
  clients: {
    client_id: string;
    file_ids?: string[];
    survey_template_ids?: string[];
  }[];
}

export async function GET(request: NextRequest) {
  try {
    // Get user session for authentication
    const session = await getBackOfficeSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    // Get client_group_id from URL search params
    const searchParams = request.nextUrl.searchParams;
    const client_id = searchParams.get("client_id");

    if (!client_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Client ID is required",
        },
        { status: 400 },
      );
    }

    // Validate client group exists
    const client = await prisma.client.findUnique({
      where: { id: client_id },
    });

    if (!client) {
      return NextResponse.json(
        {
          success: false,
          error: "Client not found",
        },
        { status: 404 },
      );
    }

    // Fetch files for the client group
    const files = await prisma.clientFiles.findMany({
      where: {
        client_id: client_id,
      },
      include: {
        ClientGroupFile: true,
        SurveyAnswers: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        files: files,
      },
      {
        status: 200,
      },
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Client group files fetch error:", {
      message: err?.message || "Unknown error",
      stack: err?.stack,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch client group files",
        details: err?.message || "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const payload: FileSharePayload = await request.json();

    // Validate required fields
    if (!payload.client_group_id) {
      return NextResponse.json(
        { error: "client_group_id is required" },
        { status: 400 },
      );
    }

    if (
      !payload.clients ||
      !Array.isArray(payload.clients) ||
      payload.clients.length === 0
    ) {
      return NextResponse.json(
        { error: "At least one client must be specified" },
        { status: 400 },
      );
    }

    if (payload.clients.length > 10) {
      return NextResponse.json(
        { error: "Maximum of 10 clients allowed per operation" },
        { status: 400 },
      );
    }

    // Get current clinician info
    const { clinicianId } = await getClinicianInfo();

    if (!clinicianId) {
      return NextResponse.json(
        { error: "Unauthorized. Clinician information not found." },
        { status: 401 },
      );
    }

    // Create transaction to ensure all related records are created or none
    const result = await prisma.$transaction(async (tx) => {
      const createdFiles = [];
      const now = new Date();

      // Process each client
      for (const client of payload.clients) {
        if (!client.client_id) {
          throw new Error("Client ID is required for each client");
        }

        if (
          !client.survey_template_ids ||
          !Array.isArray(client.survey_template_ids) ||
          client.survey_template_ids.length === 0
        ) {
          throw new Error(
            `No survey templates specified for client ${client.client_id}`,
          );
        }

        for (const fileId of client.file_ids || []) {
          const file = await tx.clientGroupFile.findUnique({
            where: {
              id: fileId,
            },
          });

          const clientGroupFile = await tx.clientGroupFile.create({
            data: {
              client_group_id: payload.client_group_id,
              survey_template_id: null,
              title: file?.title || `Shared file - ${new Date().toISOString()}`,
              type: "Practice Upload",
              url: file?.url || null,
              uploaded_by_id: file?.uploaded_by_id || null,
              created_at: now,
              updated_at: now,
            },
          });

          const clientFileId = generateUUID();
          const clientFile = await tx.clientFiles.create({
            data: {
              id: clientFileId,
              client_id: client.client_id,
              client_group_file_id: clientGroupFile.id,
              status: "Pending",
            },
          });
          createdFiles.push({
            clientGroupFileId: fileId,
            clientFileId: clientFile.id,
            clientId: client.client_id,
            surveyTemplateId: null,
          });
        }

        // Create entries for each survey template
        for (const surveyTemplateId of client.survey_template_ids) {
          // Create client group file record
          const surveyTemplate = await tx.surveyTemplate.findUnique({
            where: {
              id: surveyTemplateId,
            },
          });

          const clientGroupFile = await tx.clientGroupFile.create({
            data: {
              client_group_id: payload.client_group_id,
              survey_template_id: surveyTemplateId,
              title:
                surveyTemplate?.name ||
                `Shared file - ${new Date().toISOString()}`,
              type: "Consent",
              url: null,
              uploaded_by_id: clinicianId,
              created_at: now,
              updated_at: now,
            },
          });

          // Create client file record (individual association)
          const clientFileId = generateUUID();
          const clientFile = await tx.clientFiles.create({
            data: {
              id: clientFileId,
              client_id: client.client_id,
              client_group_file_id: clientGroupFile.id,
              status: "Pending",
            },
          });

          createdFiles.push({
            clientGroupFileId: clientGroupFile.id,
            clientFileId: clientFile.id,
            clientId: client.client_id,
            surveyTemplateId: surveyTemplateId,
          });
        }
      }

      return {
        success: true,
        totalShared: createdFiles.length,
        shared: createdFiles,
      };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    logger.error({
      message: "Error sharing files with clients",
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        error: "Failed to share files with clients",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
