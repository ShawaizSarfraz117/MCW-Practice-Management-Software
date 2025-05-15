"use client";

import { useDropzone } from "react-dropzone";
import { X } from "lucide-react";

interface ProfilePhotoUploaderProps {
  previewUrl: string | null;
  isUploading: boolean;
  onRemovePhoto: (e?: React.MouseEvent) => void;
  onSelectFile: (file: File) => void;
  error: string | null;
}

const ProfilePhotoUploader = ({
  previewUrl,
  isUploading,
  onRemovePhoto,
  onSelectFile,
  error,
}: ProfilePhotoUploaderProps) => {
  const validateImage = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(img.src);
        if (img.width < 300 || img.height < 300) {
          resolve(false);
        } else {
          resolve(true);
        }
      };

      img.onerror = () => {
        resolve(false);
      };
    });
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        // Validate image dimensions
        const isValid = await validateImage(file);
        if (!isValid) return;

        // Pass the file to parent component
        onSelectFile(file);
      }
    },
    disabled: isUploading,
  });

  return (
    <div className="bg-white rounded-md shadow-sm border border-gray-200 mb-6">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-medium text-gray-900">Profile photo</h2>
      </div>
      <div className="px-6 py-5">
        <p className="text-sm text-gray-600 mb-4">
          Add your professional profile image to personalize your SimplePractice
          account.
        </p>

        <div
          {...getRootProps()}
          className="border border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer hover:bg-gray-50"
        >
          <input {...getInputProps()} disabled={isUploading} />
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center mb-3 overflow-hidden">
              {previewUrl ? (
                <>
                  <img
                    alt="Profile photo"
                    className="w-full h-full object-cover"
                    src={previewUrl}
                  />
                  <button
                    onClick={onRemovePhoto}
                    className="absolute top-0 right-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center m-1 hover:bg-red-600 transition-colors"
                    aria-label="Remove photo"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </>
              ) : (
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-gray-400"
                >
                  <rect width="24" height="24" fill="none" />
                  <path
                    d="M4 20H20V14H22V20C22 20.5304 21.7893 21.0391 21.4142 21.4142C21.0391 21.7893 20.5304 22 20 22H4C3.46957 22 2.96086 21.7893 2.58579 21.4142C2.21071 21.0391 2 20.5304 2 20V14H4V20Z"
                    fill="currentColor"
                  />
                  <path
                    d="M13 11H16L12 7L8 11H11V17H13V11Z"
                    fill="currentColor"
                  />
                </svg>
              )}
            </div>

            <p className="text-sm font-medium text-blue-600">
              {isUploading
                ? "Uploading..."
                : error
                  ? "Try again"
                  : "Choose image or drag and drop image"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Upload .jpg or .png image
              <br />
              Max upload size: 10MB
            </p>
            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePhotoUploader;
