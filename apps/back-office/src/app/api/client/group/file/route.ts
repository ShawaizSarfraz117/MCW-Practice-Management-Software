import { NextRequest, NextResponse } from "next/server";
import { uploadToAzureStorage } from "@/utils/azureStorage";
import { prisma } from "@mcw/database";
import { getBackOfficeSession } from "@/utils/helpers";
import { Prisma } from "@prisma/client";

const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB in bytes

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
    const client_group_id = searchParams.get("client_group_id");
    const name = searchParams.get("name");

    if (!client_group_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Client group ID is required",
        },
        { status: 400 },
      );
    }

    // Validate client group exists
    const clientGroup = await prisma.clientGroup.findUnique({
      where: { id: client_group_id },
    });

    if (!clientGroup) {
      return NextResponse.json(
        {
          success: false,
          error: "Client group not found",
        },
        { status: 404 },
      );
    }

    // Build where clause
    const whereClause: Prisma.ClientGroupFileWhereInput = { client_group_id };

    // Add name filter if provided
    if (name) {
      whereClause.title = {
        contains: name,
      };
    }

    // Fetch files for the client group
    const files = await prisma.clientGroupFile.findMany({
      where: whereClause,
      include: {
        ClientFiles: true,
      },
      orderBy: {
        created_at: "desc",
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

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const client_group_id = formData.get("client_group_id") as string;
    const type = (formData.get("type") as string) || "PRACTICE_UPLOAD";

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "No file provided",
        },
        { status: 400 },
      );
    }

    if (!client_group_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Client group ID is required",
        },
        { status: 400 },
      );
    }

    // Validate client group exists
    const clientGroup = await prisma.clientGroup.findUnique({
      where: { id: client_group_id },
    });

    if (!clientGroup) {
      return NextResponse.json(
        {
          success: false,
          error: "Client group not found",
        },
        { status: 404 },
      );
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid file type. Only images, PDF, Word, and Excel files are allowed.",
        },
        { status: 400 },
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: "File size exceeds 15MB limit",
        },
        { status: 400 },
      );
    }

    // Upload to Azure Storage
    const containerName = "client-group-files";
    const virtualPath = `client-group-${client_group_id}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const uploadResult = await uploadToAzureStorage(
      buffer,
      file.name,
      containerName,
      virtualPath,
    );

    // Save file data to database using Prisma
    const fileRecord = await prisma.clientGroupFile.create({
      data: {
        title: file.name,
        type: type,
        url: uploadResult.blobUrl,
        client_group_id: client_group_id,
        uploaded_by_id: session.user.id,
        updated_at: new Date(),
      },
      select: {
        id: true,
        title: true,
        type: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        file: {
          id: fileRecord.id,
          title: fileRecord.title,
          url: uploadResult.url, // Return the SAS URL for immediate access
          type: fileRecord.type,
        },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Client group file upload error:", {
      message: err?.message || "Unknown error",
      stack: err?.stack,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload client group file",
        details: err?.message || "Internal server error",
      },
      { status: 500 },
    );
  }
}
