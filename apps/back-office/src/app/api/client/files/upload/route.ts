import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { getBackOfficeSession, getClinicianInfo } from "@/utils/helpers";
import { generateUUID } from "@mcw/utils";
import { uploadToAzureStorage } from "@/utils/azureStorage";

export async function POST(request: NextRequest) {
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

    // Get current clinician info
    const { clinicianId } = await getClinicianInfo();
    if (!clinicianId) {
      return NextResponse.json(
        { error: "Unauthorized. Clinician information not found." },
        { status: 401 },
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const clientGroupId = formData.get("client_group_id") as string;
    const title = formData.get("title") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!clientGroupId) {
      return NextResponse.json(
        { error: "client_group_id is required" },
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
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed types: PDF, DOC, DOCX, JPG, PNG" },
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

    // Upload to Azure Blob Storage
    const uploadResult = await uploadToAzureStorage(
      buffer,
      file.name,
      "client-files",
      `${clientGroupId}/uploads`,
    );

    // Create ClientGroupFile record
    const clientGroupFile = await prisma.clientGroupFile.create({
      data: {
        id: generateUUID(),
        client_group_id: clientGroupId,
        title: title || file.name,
        type: "PRACTICE_UPLOAD",
        url: uploadResult.url,
        uploaded_by_id: session.user.id,
        is_template: false,
        sharing_enabled: true,
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
      message: "File upload error",
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
    const clientGroupId = searchParams.get("client_group_id");

    if (!clientGroupId) {
      return NextResponse.json(
        {
          success: false,
          error: "client_group_id is required",
        },
        { status: 400 },
      );
    }

    // Fetch uploaded files for the client group
    const files = await prisma.clientGroupFile.findMany({
      where: {
        client_group_id: clientGroupId,
        type: "PRACTICE_UPLOAD",
        is_template: false,
      },
      include: {
        ClientFiles: true,
        User: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Transform the data to include sharing status
    const transformedFiles = files.map((file) => ({
      id: file.id,
      title: file.title,
      url: file.url,
      type: file.type,
      uploadedAt: file.created_at,
      uploadedBy: file.User ? `${file.User.id}` : null,
      isShared: file.ClientFiles.length > 0,
      sharedAt:
        file.ClientFiles.length > 0 ? file.ClientFiles[0].shared_at : null,
      sharingEnabled: file.sharing_enabled,
    }));

    return NextResponse.json(
      {
        success: true,
        files: transformedFiles,
      },
      {
        status: 200,
      },
    );
  } catch (error: unknown) {
    const err = error as Error;
    logger.error({
      message: "Files fetch error",
      error: err?.message || "Unknown error",
      stack: err?.stack,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch files",
        details: err?.message || "Internal server error",
      },
      { status: 500 },
    );
  }
}
