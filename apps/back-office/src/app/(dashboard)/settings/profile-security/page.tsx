"use client";

import { z } from "zod";
import { useForm } from "@mcw/ui";
import { useState, useCallback, useEffect } from "react";
import ProfileHeader from "./profile/ProfileHeader";
import ProfileInfo from "./profile/ProfileInfo";
import ProfilePhoto from "./profile/ProfilePhoto";
import { toast } from "@mcw/ui";
import { useQueryClient } from "@tanstack/react-query";
import { useProfile } from "./profile/hooks/useProfile";

export const profileSchema = z.object({
  dateOfBirth: z.string().optional().nullable(),
  phone: z
    .string()
    .regex(
      /^(\+?\d{1,4}[\s-]?)?(\(?\d{3}\)?[\s-]?)?[\d\s-]{7,14}$/,
      "Invalid phone number format",
    )
    .optional()
    .nullable(),
  profilePhoto: z.string().max(500).optional().nullable(),
});

export type ProfileFormData = {
  dateOfBirth?: string | null;
  phone?: string | null;
  profilePhoto?: string | null;
};

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();
  const { data: profileInfo, isLoading } = useProfile();

  const form = useForm({
    defaultValues: {
      dateOfBirth: "",
      phone: "",
      profilePhoto: "",
    },
    onSubmit: async ({ value }: { value: ProfileFormData }) => {
      const result = profileSchema.safeParse(value);
      if (!result.success) {
        // Set form errors if validation fails
        result.error.errors.forEach((error) => {
          // form.setFieldError(error.path[0], error.message);
          console.log(error.path[0]);
          console.log(error.message);
        });
        return; // Stop submission
      }
      try {
        const response = await fetch("/api/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(value),
        });

        if (!response.ok) {
          throw new Error("Failed to update profile");
        }

        toast({
          title: "Profile updated successfully",
          variant: "success",
        });

        setIsEditing(false);
        queryClient.refetchQueries({ queryKey: ["profile"] });
      } catch (error) {
        console.error("Error updating profile:", error);
        toast({
          title: "Error updating profile",
          variant: "destructive",
        });
      }
    },
  });

  // Initialize form with profile data
  useEffect(() => {
    if (profileInfo) {
      form.setFieldValue(
        "dateOfBirth",
        profileInfo.date_of_birth
          ? new Date(profileInfo.date_of_birth).toISOString().split("T")[0]
          : null,
      );
      form.setFieldValue("phone", profileInfo.phone || null);
      form.setFieldValue("profilePhoto", profileInfo.profile_photo || null);
    }
  }, [profileInfo, form]);

  const { handleSubmit } = form;

  const handleSave = useCallback(() => {
    handleSubmit();
  }, [handleSubmit]);

  if (isLoading) {
    return <div className="p-4">Loading profile information...</div>;
  }

  return (
    <div>
      <ProfileHeader
        form={form as ReturnType<typeof useForm>}
        handleSave={handleSave}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
      />
      <ProfileInfo
        form={form as ReturnType<typeof useForm>}
        isEditing={isEditing}
      />
      <ProfilePhoto
        form={form as ReturnType<typeof useForm>}
        isEditing={isEditing}
      />
    </div>
  );
}
