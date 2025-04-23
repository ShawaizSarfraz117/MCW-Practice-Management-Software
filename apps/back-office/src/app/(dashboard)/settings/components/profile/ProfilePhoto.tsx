"use client";

import { useDropzone } from "react-dropzone";
import { useForm } from "@mcw/ui";
import { SquareUser } from "lucide-react";
const ProfilePhoto = ({
  form,
  isEditing,
}: {
  form: ReturnType<typeof useForm>;
  isEditing: boolean;
}) => {
  const profilePhoto = form.getFieldValue("profilePhoto");

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        const filePath = `/uploads/${file.name}`;
        form.setFieldValue("profilePhoto", filePath);
      }
    },
    accept: {
      "image/*": [".jpeg", ".jpg", ".png"],
    },
    maxFiles: 1,
  });

  return (
    <div className="mb-8">
      <h2 className="text-lg font-medium text-gray-800 mb-2">Profile photo</h2>
      <p className="text-gray-600 mb-4">
        Add your professional profile image to personalize your SimplePractice
        account.
      </p>
      <div
        {...getRootProps()}
        className="border border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center text-center"
      >
        {isEditing ? (
          <div
            {...getRootProps()}
            className="border border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center text-center"
          >
            <input {...getInputProps()} />
            <p className="text-sm text-gray-600">
              {isDragActive
                ? "Drop the file here"
                : "Choose image or drag and drop image"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Upload .jpg or .png image
              <br />
              Max upload size: 10MB
            </p>
          </div>
        ) : (
          <div className="mb-4">
            {profilePhoto ? (
              <div className="relative w-16 h-16 rounded-full overflow-hidden">
                <SquareUser className="h-16 w-16 text-gray-300" />
              </div>
            ) : (
              <SquareUser className="h-16 w-16 text-gray-300" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePhoto;
