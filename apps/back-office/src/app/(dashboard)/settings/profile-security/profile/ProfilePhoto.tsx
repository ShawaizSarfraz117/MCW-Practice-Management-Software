"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BlobToSaas } from "@/utils/blobToSaas";
import { useProfile } from "./hooks/useProfile";
import { ProfileFormType } from "../types";
import ProfilePhotoUploader from "./components/ProfilePhotoUploader";
import ImageCropper from "./components/ImageCropper";
import { uploadFile, saveProfilePhoto } from "./services/profilePhotoService";

const ProfilePhoto = ({ form }: { form: ProfileFormType }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);

  const { data: profileInfo } = useProfile();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: (data) => {
      form.setFieldValue("profilePhoto", data.blobUrl);
      setError(null);
      handleSaveProfilePhoto(data.blobUrl);
    },
    onError: (error) => {
      console.error("Upload error:", error);
      setError("Failed to upload image");
    },
  });

  const handleSaveProfilePhoto = async (photoUrl: string | null) => {
    try {
      const dateOfBirth = form.getFieldValue("dateOfBirth") || null;
      const phone = form.getFieldValue("phone") || null;
      const username = form.getFieldValue("username") || null;

      await saveProfilePhoto(photoUrl, dateOfBirth, phone, username);
      queryClient.refetchQueries({ queryKey: ["profile"] });
    } catch (_error) {
      // Error already handled in the service
    }
  };

  const handleRemovePhoto = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setPreviewUrl(null);
    form.setFieldValue("profilePhoto", null);
    handleSaveProfilePhoto(null);
  };

  const handleSelectFile = (file: File) => {
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setEditImageUrl(objectUrl);
    setShowCropModal(true);
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setEditImageUrl(null);
    if (editImageUrl) {
      URL.revokeObjectURL(editImageUrl);
    }
  };

  const handleCropApply = (croppedFile: File) => {
    uploadMutation.mutate(croppedFile);

    // Create preview
    const objectUrl = URL.createObjectURL(croppedFile);
    setPreviewUrl(objectUrl);

    // Close modal
    setShowCropModal(false);
    setEditImageUrl(null);
  };

  // Clean up the preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl && !previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
      if (editImageUrl) {
        URL.revokeObjectURL(editImageUrl);
      }
    };
  }, [previewUrl, editImageUrl]);

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
    <>
      <ProfilePhotoUploader
        error={error}
        isUploading={uploadMutation.isPending}
        previewUrl={previewUrl}
        onRemovePhoto={handleRemovePhoto}
        onSelectFile={handleSelectFile}
      />

      {/* Image Edit Modal */}
      {showCropModal && editImageUrl && selectedFile && (
        <ImageCropper
          fileName={selectedFile.name}
          fileType={selectedFile.type}
          imageUrl={editImageUrl}
          onApply={handleCropApply}
          onCancel={handleCropCancel}
        />
      )}
    </>
  );
};

export default ProfilePhoto;
