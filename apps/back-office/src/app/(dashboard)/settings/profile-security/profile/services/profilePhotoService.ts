import { toast } from "@mcw/ui";

/**
 * Uploads a file to the server
 */
export async function uploadFile(file: File): Promise<{ blobUrl: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Upload failed");
  }

  return response.json();
}

/**
 * Saves the profile photo URL to the user's profile
 */
export async function saveProfilePhoto(
  photoUrl: string | null,
  dateOfBirth: string | null,
  phone: string | null,
  username: string | null = null,
): Promise<void> {
  try {
    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        profilePhoto: photoUrl,
        dateOfBirth,
        phone,
        username,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error response:", errorData);
      throw new Error(errorData.details || "Failed to update profile photo");
    }

    toast({
      title: photoUrl
        ? "Profile photo updated successfully"
        : "Profile photo removed",
      variant: "success",
    });
  } catch (error) {
    console.error("Error updating profile photo:", error);
    toast({
      title: "Error updating profile photo",
      variant: "destructive",
    });
    throw error;
  }
}
