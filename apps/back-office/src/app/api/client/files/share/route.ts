import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { getBackOfficeSession } from "@/utils/helpers";
import { generateUUID } from "@mcw/utils";
import { copyBlobInAzureStorage } from "@/utils/azureStorage";

interface ShareFilePayload {
  file_id: string;
  client_ids: string[];
  copy_to_client_folder?: boolean;
}

// POST /api/client/files/share - Share an existing file with multiple clients
export async function POST(request: NextRequest) {
  try {
    const session = await getBackOfficeSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload: ShareFilePayload = await request.json();

    if (!payload.file_id) {
      return NextResponse.json(
        { error: "file_id is required" },
        { status: 400 },
      );
    }

    if (
      !payload.client_ids ||
      !Array.isArray(payload.client_ids) ||
      payload.client_ids.length === 0
    ) {
      return NextResponse.json(
        { error: "At least one client_id must be specified" },
        { status: 400 },
      );
    }

    // Verify the file exists
    const clientGroupFile = await prisma.clientGroupFile.findUnique({
      where: { id: payload.file_id },
      include: {
        ClientGroup: true,
      },
    });

    if (!clientGroupFile) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Create ClientFiles records for each client in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const createdShares = [];

      for (const clientId of payload.client_ids) {
        // Verify client exists and belongs to the same group
        const client = await tx.client.findFirst({
          where: {
            id: clientId,
            ClientGroupMembership: {
              some: {
                client_group_id: clientGroupFile.client_group_id,
              },
            },
          },
        });

        if (!client) {
          throw new Error(
            `Client ${clientId} not found or not in the same group`,
          );
        }

        // Check if already shared
        const existingShare = await tx.clientFiles.findFirst({
          where: {
            client_id: clientId,
            client_group_file_id: payload.file_id,
          },
        });

        if (existingShare) {
          continue; // Skip if already shared
        }

        let _fileUrl = clientGroupFile.url;

        // If copy_to_client_folder is true and file has a URL, copy it to client's folder
        if (
          payload.copy_to_client_folder &&
          clientGroupFile.url &&
          clientGroupFile.type === "Practice Upload"
        ) {
          try {
            const destinationPath = `${clientGroupFile.client_group_id}/${clientId}`;
            _fileUrl = await copyBlobInAzureStorage(
              clientGroupFile.url,
              destinationPath,
            );
          } catch (copyError) {
            console.error(
              `Failed to copy file for client ${clientId}:`,
              copyError,
            );
          }
        }

        // Create the share
        const clientFile = await tx.clientFiles.create({
          data: {
            id: generateUUID(),
            client_id: clientId,
            client_group_file_id: payload.file_id,
            status: "Shared",
            shared_at: new Date(),
          },
          include: {
            Client: true,
            ClientGroupFile: true,
          },
        });

        createdShares.push(clientFile);
      }

      return createdShares;
    });

    return NextResponse.json({
      success: true,
      message: `File shared with ${result.length} client(s)`,
      shares: result,
    });
  } catch (error: unknown) {
    logger.error({
      message: "Failed to share file",
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        error: "Failed to share file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
