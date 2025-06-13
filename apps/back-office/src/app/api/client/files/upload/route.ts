import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { getBackOfficeSession } from "@/utils/helpers";
import { generateUUID } from "@mcw/utils";
import { uploadToAzureStorage } from "@/utils/azureStorage";

// POST /api/client/files/client-upload - Upload a file directly to a specific client
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

    // Validate client exists and belongs to the group
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        ClientGroupMembership: {
          some: {
            client_group_id: clientGroupId,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found or not in the specified group" },
        { status: 404 },
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Replace spaces with underscores in filename
    const sanitizedFileName = file.name.replace(/\s+/g, '_');

    // Upload to Azure Blob Storage with new folder structure
    // Client-specific files go to: client-groups/{clientGroupId}/{clientId}/
    const virtualPath = `${clientGroupId}/${clientId}`;
    const uploadResult = await uploadToAzureStorage(
      buffer,
      sanitizedFileName,
      "client-groups",
      virtualPath,
    );

    // Create transaction to ensure both records are created
    const result = await prisma.$transaction(async (tx) => {
      // Create ClientGroupFile record
      const clientGroupFile = await tx.clientGroupFile.create({
        data: {
          id: generateUUID(),
          client_group_id: clientGroupId,
          title: title || file.name,
          type: "Client Upload", // New type for client-specific uploads
          url: uploadResult.blobUrl,
          uploaded_by_id: session.user.id,
        },
      });

      // Create ClientFiles record to link to specific client
      const clientFile = await tx.clientFiles.create({
        data: {
          id: generateUUID(),
          client_id: clientId,
          client_group_file_id: clientGroupFile.id,
          status: "Uploaded",
          shared_at: new Date(),
        },
      });

      return {
        clientGroupFile,
        clientFile,
      };
    });

    return NextResponse.json(
      {
        success: true,
        file: {
          id: result.clientFile.id,
          clientGroupFileId: result.clientGroupFile.id,
          title: result.clientGroupFile.title,
          url: result.clientGroupFile.url,
          type: result.clientGroupFile.type,
          status: result.clientFile.status,
          uploadedAt: result.clientGroupFile.created_at,
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
