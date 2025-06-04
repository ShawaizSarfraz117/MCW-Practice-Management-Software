export async function BlobToSaas(blobUrl: string): Promise<string> {
  try {
    const response = await fetch("/api/blobToSaas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ blobUrl }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate SAS token");
    }

    const data = await response.json();
    return data.sasUrl;
  } catch (error) {
    console.error("Error generating SAS token:", error);
    // Return the original URL as fallback
    return blobUrl;
  }
}
