"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useCallback, useEffect } from "react";
import ProfileHeader from "./profile/ProfileHeader";
import ProfileInfo from "./profile/ProfileInfo";
import SecurityInfo from "./profile/SecurityInfo";
import ProfilePhoto from "./profile/ProfilePhoto";
import { useQuery } from "@tanstack/react-query";
import { toast } from "../../../../../../../packages/ui/src/components/sonner"; // Adjust the path

export const profileSchema = z.object({
  dateOfBirth: z.string().date().optional().nullable(),
  phone: z.string().min(10).max(20).optional().nullable(),
  profilePhoto: z.string().url().max(500).optional().nullable(),
});

export type ProfileFormData = {
  dateOfBirth?: string | null; // Optional and can be null
  phone?: string | null; // Optional and can be null
  profilePhoto?: string | null; // Optional and can be null
};
type ProfileData = {
  created_at: string;
  date_of_birth: string;
  id: string;
  phone: string;
  profile_photo: string;
  updated_at: string;
  user_id: string;
};

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState();
  const [defaultValues, setDefaultValues] = useState({
    dateOfBirth: "",
    phone: "",
    profilePhoto: "",
  });

  const { register, setValue, watch } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: defaultValues,
  });

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // Handle file upload logic
      const file = acceptedFiles[0];
      if (file) {
        const filePath = `/uploads/${file.name}`;
        setValue("profilePhoto", filePath);
      }
      console.log(acceptedFiles);
    },
    [setValue],
  );

  const handleSave = useCallback(() => {
    const formData = {
      dateOfBirth: watch("dateOfBirth"),
      phone: watch("phone"),
      profilePhoto: watch("profilePhoto"),
    };

    // Validate all required fields are present
    const hasAllFields = Object.values(formData).every(
      (value) => value !== undefined && value !== null,
    );

    if (!hasAllFields) {
      console.error("Missing required fields");

      return;
    }
    const updateProfile = async (data: ProfileFormData) => {
      try {
        const response = await fetch("/api/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error("Failed to update profile");
        }

        toast.success("Profile updated successfully", {
          duration: 4000,
          position: "top-center",
        });
        setIsEditing(false);
        setDefaultValues({
          dateOfBirth: formData?.dateOfBirth || "",
          phone: formData?.phone || "",
          profilePhoto: formData?.profilePhoto || "",
        });
      } catch (error) {
        console.error("Error updating profile:", error);
        toast.error("Failed to update profile", {
          duration: 4000,
          position: "top-center",
        });
      }
    };

    updateProfile(formData);
    console.log("Saving profile...");
  }, []);

  useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await fetch("/api/profile");
      if (!response.ok) {
        throw new Error("Failed to fetch profile data");
      }
      const profile = await response.json();
      setProfileData(profile);
      return response.json();
    },
  });

  useEffect(() => {
    setDefaultValues({
      dateOfBirth: profileData
        ? (profileData as ProfileData).date_of_birth
        : "",
      phone: profileData ? (profileData as ProfileData).phone : "",
      profilePhoto: profileData
        ? (profileData as ProfileData).profile_photo
        : "",
    });
    setValue("dateOfBirth", defaultValues.dateOfBirth);
    setValue("phone", defaultValues.phone);
    setValue("profilePhoto", defaultValues.profilePhoto);
  }, [profileData, setValue]);

  return (
    <div className="max-w-3xl mx-auto">
      <ProfileHeader />
      <ProfileInfo
        defaultValues={defaultValues}
        handleSave={handleSave}
        isEditing={isEditing}
        register={register}
        setIsEditing={setIsEditing}
      />
      <SecurityInfo
        defaultValues={defaultValues}
        isEditing={isEditing}
        register={register}
      />
      <ProfilePhoto
        onDrop={onDrop}
        defaultValues={defaultValues}
        watch={watch}
      />
    </div>
  );
}
