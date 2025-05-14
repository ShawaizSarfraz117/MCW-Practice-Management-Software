"use client";

import { useDropzone } from "react-dropzone";
import { useForm } from "@mcw/ui";
import { SquareUser } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { BlobToSaas } from "@/utils/blobToSaas";
import { useProfile } from "./hooks/useProfile";

async function uploadFile(file: File) {
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

const ProfilePhoto = ({
  form,
  isEditing,
}: {
  form: ReturnType<typeof useForm>;
  isEditing: boolean;
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: profileInfo } = useProfile();

  const uploadMutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: (data) => {
      form.setFieldValue("profilePhoto", data.blobUrl);
      setError(null);
    },
    onError: (error) => {
      console.error("Upload error:", error);
      setError("Failed to upload image");
    },
  });

  const validateImage = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(img.src);
        if (img.width < 300 || img.height < 300) {
          setError("Image must be at least 300x300 pixels");
          resolve(false);
        } else {
          setError(null);
          resolve(true);
        }
      };

      img.onerror = () => {
        setError("Invalid image file");
        resolve(false);
      };
    });
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        // Validate image dimensions
        const isValid = await validateImage(file);
        if (!isValid) return;

        // Create preview
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        // Upload file using mutation
        uploadMutation.mutate(file);
      }
    },
    onDropRejected: (fileRejections) => {
      const { code, message } = fileRejections[0].errors[0];
      if (code === "file-too-large") {
        setError("File is larger than 5MB");
      } else {
        setError(message);
      }
    },
    disabled: !isEditing || uploadMutation.isPending,
  });

  // Clean up the preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Show existing profile photo if available
  useEffect(() => {
    const profilePhoto = form.getFieldValue("profilePhoto") as
      | string
      | undefined
      | null;
    if (profilePhoto) {
      BlobToSaas(profilePhoto).then((sasToken) => {
        setPreviewUrl(sasToken);
      });
    } else if (profileInfo?.profile_photo) {
      BlobToSaas(profileInfo.profile_photo).then((sasToken) => {
        setPreviewUrl(sasToken);
      });
    }
  }, [form, profileInfo]);

  return (
    <div className="mb-8">
      <h2 className="text-lg font-medium text-gray-800 mb-2">Profile photo</h2>
      <p className="text-gray-600 mb-4">
        Add your professional profile image to personalize your account.
      </p>

      <div
        {...getRootProps()}
        className={`mt-1 border-2 border-dashed rounded-lg p-4 text-center hover:bg-gray-50 ${isEditing ? "cursor-pointer" : "cursor-default"} ${
          uploadMutation.isPending ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        <input
          {...getInputProps()}
          disabled={!isEditing || uploadMutation.isPending}
        />
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-2">
          {previewUrl ? (
            <img
              alt="Profile photo preview"
              className="w-full h-full object-cover rounded-full"
              src={previewUrl}
            />
          ) : (
            <SquareUser className="h-10 w-10 text-gray-400" />
          )}
        </div>
        {isEditing && (
          <>
            <p className="text-sm text-gray-500 mb-1">
              {uploadMutation.isPending
                ? "Uploading..."
                : "Choose image or drag and drop"}
            </p>
            <p className="text-xs text-gray-400">
              Upload a jpg or png image (max 5 MB) with minimum 300x300 pixels
            </p>
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
};

export default ProfilePhoto;
