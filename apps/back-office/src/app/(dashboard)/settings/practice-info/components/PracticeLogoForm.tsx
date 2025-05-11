import { PracticeInformation } from "@/types/profile";
import { Label } from "@mcw/ui";
import { useDropzone } from "react-dropzone";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  uploadFile,
  usePracticeInformation,
} from "./hooks/usePracticeInformation";
import { BlobToSaas } from "@/utils/blobToSaas";

export default function PracticeLogoForm({
  practiceInfoState,
  setPracticeInfoState,
  className,
}: {
  practiceInfoState: PracticeInformation;
  setPracticeInfoState: (practiceInfoState: PracticeInformation) => void;
  className?: string;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { practiceInformation } = usePracticeInformation();

  const uploadMutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: (data) => {
      setPracticeInfoState({
        ...practiceInfoState,
        practice_logo: data.blobUrl,
      });
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
        if (img.width < 1000 || img.height < 1000) {
          setError("Image must be at least 1000x1000 pixels");
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
    maxSize: 15 * 1024 * 1024, // 15MB
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
        setError("File is larger than 15MB");
      } else {
        setError(message);
      }
    },
  });

  // Clean up the preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Show existing logo if available
  useEffect(() => {
    if (practiceInfoState.practice_logo) {
      setPreviewUrl(practiceInfoState.practice_logo);
      console.log(
        "practiceInfoState.practice_logo",
        practiceInfoState.practice_logo,
      );
      BlobToSaas(practiceInfoState.practice_logo).then((sasToken) => {
        setPreviewUrl(sasToken);
      });
    }
  }, [practiceInfoState.practice_logo]);

  return (
    <div className={className}>
      <Label>Practice Logo</Label>
      <div
        {...getRootProps()}
        className={`mt-1 border-2 border-dashed rounded-lg p-4 text-center hover:bg-gray-50 cursor-pointer ${
          uploadMutation.isPending ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        <input {...getInputProps()} disabled={uploadMutation.isPending} />
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center mb-2">
          {previewUrl ? (
            <img
              alt="Practice logo preview"
              className="w-full h-full object-cover rounded-md"
              src={previewUrl}
            />
          ) : practiceInformation?.practice_logo ? (
            <img
              alt="Practice logo preview"
              className="w-full h-full object-cover rounded-md"
              src={practiceInformation?.practice_logo}
            />
          ) : (
            <svg
              className="h-6 w-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-1">
          {uploadMutation.isPending
            ? "Uploading..."
            : "Choose image or drag and drop image"}
        </p>
        <p className="text-xs text-gray-400">
          Upload a jpg or png image (max 15 MB) with minimum 1,000 height and
          1000 width
        </p>
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </div>
    </div>
  );
}
