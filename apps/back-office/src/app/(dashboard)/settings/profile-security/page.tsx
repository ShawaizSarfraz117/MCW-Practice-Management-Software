"use client";

import { z } from "zod";
import { useForm } from "@mcw/ui";
import { useEffect } from "react";
import { toast } from "@mcw/ui";
import { useQueryClient } from "@tanstack/react-query";
import { useProfile } from "./profile/hooks/useProfile";
import ProfileHeader from "./profile/ProfileHeader";
import ProfileInfo from "./profile/ProfileInfo";
import SecurityInfo from "./profile/SecurityInfo";
import ProfilePhoto from "./profile/ProfilePhoto";
import { ProfileFormData, ProfileFormType } from "./types";

export const profileSchema = z.object({
  dateOfBirth: z.string().optional().nullable(),
  phone: z
    .string()
    .regex(/^[- +()0-9]*$/, "Only valid phone numbers are allowed.")
    .optional()
    .nullable(),
  profilePhoto: z.string().max(500).optional().nullable(),
});

export default function Profile() {
  const queryClient = useQueryClient();
  const { data: profileInfo, isLoading } = useProfile();

  const form = useForm<ProfileFormData>({
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

      // Ensure date is properly formatted
      const dateOfBirth =
        value.dateOfBirth && value.dateOfBirth !== ""
          ? new Date(value.dateOfBirth).toISOString().split("T")[0]
          : null;

      try {
        const response = await fetch("/api/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...value,
            dateOfBirth,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Error response:", errorData);
          throw new Error(errorData.details || "Failed to update profile");
        }

        toast({
          title: "Profile updated successfully",
          variant: "success",
        });

        queryClient.refetchQueries({ queryKey: ["profile"] });
      } catch (error) {
        console.error("Error updating profile:", error);
        toast({
          title: "Error updating profile",
          variant: "destructive",
        });
      }
    },
  }) as ProfileFormType;

  // Initialize form with profile data
  useEffect(() => {
    if (profileInfo) {
      // Format date or set to null
      const formattedDate = profileInfo.date_of_birth
        ? new Date(profileInfo.date_of_birth).toISOString().split("T")[0]
        : null;

      form.setFieldValue("dateOfBirth", formattedDate);
      form.setFieldValue("phone", profileInfo.phone || null);
      form.setFieldValue("profilePhoto", profileInfo.profile_photo || null);
    }
  }, [profileInfo, form]);

  if (isLoading) {
    return (
      <div className="p-6 bg-gray-50 text-gray-500">
        Loading profile information...
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <ProfileHeader />
      <ProfileInfo form={form} />
      <SecurityInfo form={form} />
      <ProfilePhoto form={form} />
    </div>
  );
}
