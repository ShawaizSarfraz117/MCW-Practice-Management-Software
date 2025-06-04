import { NextRequest, NextResponse } from "next/server";
import { BlobServiceClient, BlobSASPermissions } from "@azure/storage-blob";

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_SECRET || "";

export async function POST(request: NextRequest) {
  try {
    // Check for Azure credentials first
    if (!AZURE_STORAGE_CONNECTION_STRING) {
      console.error("Azure Storage Connection String is not configured");
      return NextResponse.json(
        {
          error: "Storage service is not properly configured",
          details: "Missing Azure credentials",
        },
        {
          status: 503,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    const { blobUrl } = await request.json();

    if (!blobUrl) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: "Blob URL is required",
        },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    try {
      // Extract container and blob name from the URL
      const url = new URL(blobUrl);
      const pathParts = url.pathname.split("/");
      const containerName = pathParts[1]; // First part after the domain
      const blobName = pathParts.slice(2).join("/"); // Rest of the path

      if (!containerName || !blobName) {
        return NextResponse.json(
          {
            error: "Invalid blob URL",
            details: "URL must contain both container name and blob path",
          },
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
      }

      // Initialize blob service client with connection string
      const blobServiceClient = BlobServiceClient.fromConnectionString(
        AZURE_STORAGE_CONNECTION_STRING,
      );

      // Get container client and then blob client
      const containerClient =
        blobServiceClient.getContainerClient(containerName);
      const blobClient = containerClient.getBlobClient(blobName);

      // Check if blob exists
      const exists = await blobClient.exists();
      if (!exists) {
        return NextResponse.json(
          {
            error: "Blob not found",
            details: "The requested blob does not exist",
          },
          {
            status: 404,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
      }

      // Generate SAS token
      const permissions = new BlobSASPermissions();
      permissions.read = true; // Only allow reading
      const sasToken = await blobClient.generateSasUrl({
        permissions,
        expiresOn: new Date(new Date().valueOf() + 60 * 60 * 1000), // 1 hour from now
      });

      return NextResponse.json(
        { sasUrl: sasToken },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    } catch (urlError) {
      console.error("Error processing blob URL:", urlError);
      return NextResponse.json(
        {
          error: "Invalid blob URL",
          details: "The provided URL is not properly formatted",
        },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }
  } catch (error: unknown) {
    console.error("Error generating SAS token:", error);

    // Handle specific Azure errors
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "RestError" &&
      "message" in error &&
      typeof error.message === "string"
    ) {
      return NextResponse.json(
        {
          error: "Azure storage error",
          details: error.message,
        },
        {
          status: 502,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Generic error handler
    return NextResponse.json(
      {
        error: "Internal server error",
        details: "Failed to generate SAS token",
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}
