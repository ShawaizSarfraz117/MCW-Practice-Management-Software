import {
  BlobServiceClient,
  BlobSASPermissions,
  RestError,
} from "@azure/storage-blob";

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_SECRET || "";

async function ensureContainerExists(containerName: string) {
  if (!AZURE_STORAGE_CONNECTION_STRING) {
    throw new Error(
      "AZURE_STORAGE_CONNECTION_STRING environment variable is not configured",
    );
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(
    AZURE_STORAGE_CONNECTION_STRING,
  );
  const containerClient = blobServiceClient.getContainerClient(containerName);

  try {
    await containerClient.createIfNotExists();
    console.log(`Container ${containerName} created or already exists`);
  } catch (error) {
    console.error(`Error creating container ${containerName}:`, error);
    if (error instanceof RestError) {
      throw error; // Preserve Azure-specific errors
    }
    throw new Error(`Failed to create or access container ${containerName}`);
  }

  return containerClient;
}

interface UploadResult {
  url: string;
  blobName: string;
  blobUrl: string;
}

/**
 * Uploads a file to Azure Blob Storage and returns the public URL
 * @param file - The file to upload
 * @param customFileName - Optional custom file name to use instead of the original
 * @param containerName - Optional container name to use instead of the default 'clients'
 * @param virtualPath - Optional virtual directory path
 * @returns Promise containing the public URL of the uploaded file
 */
export async function uploadToAzureStorage(
  file: File | Buffer,
  customFileName?: string,
  containerName: string = "clients",
  virtualPath?: string,
): Promise<UploadResult> {
  try {
    const containerClient = await ensureContainerExists(containerName);

    // Generate a unique blob name using timestamp and original filename or custom name
    const timestamp = new Date().getTime();
    const originalName = file instanceof File ? file.name : customFileName;

    if (!originalName) {
      throw new Error("File name is required when uploading a Buffer");
    }

    const fileExtension = originalName.split(".").pop();
    // Add virtual directory path to blob name if provided
    const blobName = virtualPath
      ? `${virtualPath.replace(/^\/+|\/+$/g, "")}/${timestamp}-${originalName}`
      : `${timestamp}-${originalName}`;

    // Get a block blob client
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload the file
    try {
      if (file instanceof File) {
        const arrayBuffer = await file.arrayBuffer();
        await blockBlobClient.uploadData(arrayBuffer, {
          blobHTTPHeaders: {
            blobContentType: file.type,
          },
        });
      } else {
        await blockBlobClient.uploadData(file, {
          blobHTTPHeaders: {
            blobContentType: `application/${fileExtension}`,
          },
        });
      }
    } catch (uploadError) {
      if (uploadError instanceof RestError) {
        throw uploadError; // Preserve Azure-specific errors
      }
      throw new Error("Failed to upload file data to Azure Blob Storage");
    }

    // Generate a SAS token for temporary access
    const permissions = new BlobSASPermissions();
    permissions.read = true; // Only allow reading

    const sasToken = await blockBlobClient.generateSasUrl({
      permissions,
      expiresOn: new Date(new Date().valueOf() + 60 * 60 * 1000), // 1 hours from now
    });
    const blobUrl = blockBlobClient.url;

    return {
      url: sasToken,
      blobUrl,
      blobName,
    };
  } catch (error) {
    console.error("Azure storage error:", error);

    // Handle missing credentials
    if (
      error instanceof Error &&
      error.message.includes("AZURE_STORAGE_CONNECTION_STRING")
    ) {
      throw error; // Preserve the credential error
    }

    // Handle Azure-specific errors
    if (error instanceof RestError) {
      throw error; // Preserve Azure-specific errors
    }

    // Handle other errors
    throw new Error("Failed to upload file to Azure Blob Storage");
  }
}
