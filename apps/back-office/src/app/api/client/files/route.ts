import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { getBackOfficeSession } from "@/utils/helpers";
import { generateUUID } from "@mcw/utils";
import { uploadToAzureStorage } from "@/utils/azureStorage";
import { ClientFileResponse, FileFrequency } from "@mcw/types";

// GET /api/client/files - Get client files (if we need a list endpoint)
export async function GET(request: NextRequest) {
  try {
    const session = await getBackOfficeSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get("client_id");
    const clientGroupIdParam = searchParams.get("client_group_id");

    // Support both client_id and client_group_id queries
    if (!clientId && !clientGroupIdParam) {
      return NextResponse.json(
        { error: "Either client_id or client_group_id is required" },
        { status: 400 },
      );
    }

    let clientGroupId: string;
    let sharedFiles: ClientFileResponse[] = [];

    if (clientGroupIdParam) {
      // Direct query by client_group_id - used by share documents
      clientGroupId = clientGroupIdParam;
    } else if (clientId) {
      // Get client's group ID through ClientGroupMembership
      const clientWithGroup = await prisma.client.findUnique({
        where: { id: clientId },
        include: {
          ClientGroupMembership: {
            select: {
              client_group_id: true,
            },
          },
        },
      });

      if (!clientWithGroup || !clientWithGroup.ClientGroupMembership[0]) {
        return NextResponse.json(
          { error: "Client or group not found" },
          { status: 404 },
        );
      }

      clientGroupId = clientWithGroup.ClientGroupMembership[0].client_group_id;

      // Get all shared files for this specific client
      const rawSharedFiles = await prisma.clientFiles.findMany({
        where: {
          client_id: clientId,
        },
        include: {
          ClientGroupFile: true,
          SurveyAnswers: true,
        },
        orderBy: {
          shared_at: "desc",
        },
      });

      // Map the raw data to proper ClientFileResponse type
      sharedFiles = rawSharedFiles.map((file) => ({
        ...file,
        frequency: file.frequency as FileFrequency | null,
      }));
    } else {
      return NextResponse.json(
        { error: "Unable to determine client group" },
        { status: 400 },
      );
    }

    // Get all files for the client group (Practice Uploads)
    const practiceUploads = await prisma.clientGroupFile.findMany({
      where: {
        client_group_id: clientGroupId,
        type: "Practice Upload",
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Format response for share documents compatibility
    if (clientGroupIdParam && !clientId) {
      // Share documents expects a specific format
      const files = practiceUploads.map((file) => ({
        id: file.id,
        title: file.title,
        url: file.url,
        type: file.type,
        uploadedAt: file.created_at,
        uploadedBy: file.uploaded_by_id,
        isShared: false,
        sharedAt: null,
        sharingEnabled: true,
        status: "uploaded",
      }));

      return NextResponse.json({
        success: true,
        files,
      });
    }

    // Original response format for client files tab
    return NextResponse.json({
      success: true,
      practiceUploads,
      sharedFiles,
    });
  } catch (error: unknown) {
    logger.error({
      message: "Failed to fetch client files",
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 },
    );
  }
}

// POST /api/client/files - Upload a new file
export async function POST(request: NextRequest) {
  try {
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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const clientId = formData.get("client_id") as string;
    const clientGroupId = formData.get("client_group_id") as string;
    const title = formData.get("title") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!clientId || !clientGroupId) {
      return NextResponse.json(
        { error: "client_id and client_group_id are required" },
        { status: 400 },
      );
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "image/gif",
      "text/plain",
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Allowed types: PDF, DOC, DOCX, JPG, PNG, GIF, TXT, CSV, XLS, XLSX",
        },
        { status: 400 },
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 },
      );
    }

    // Validate client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Validate client group exists
    const clientGroup = await prisma.clientGroup.findUnique({
      where: { id: clientGroupId },
    });

    if (!clientGroup) {
      return NextResponse.json(
        { error: "Client group not found" },
        { status: 404 },
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Replace spaces with underscores in filename
    const sanitizedFileName = file.name.replace(/\s+/g, '_');

    const virtualPath = `${clientGroupId}/practice-uploads`;
    const uploadResult = await uploadToAzureStorage(
      buffer,
      sanitizedFileName,
      "client-groups",
      virtualPath,
    );

    const clientGroupFile = await prisma.clientGroupFile.create({
      data: {
        id: generateUUID(),
        client_group_id: clientGroupId,
        title: title || file.name,
        type: "Practice Upload",
        url: uploadResult.blobUrl,
        uploaded_by_id: session.user.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        file: {
          id: clientGroupFile.id,
          title: clientGroupFile.title,
          url: clientGroupFile.url,
          type: clientGroupFile.type,
          uploadedAt: clientGroupFile.created_at,
        },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const err = error as Error;
    logger.error({
      message: "Client file upload error",
      error: err?.message || "Unknown error",
      stack: err?.stack,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload file",
        details: err?.message || "Internal server error",
      },
      { status: 500 },
    );
  }
}
