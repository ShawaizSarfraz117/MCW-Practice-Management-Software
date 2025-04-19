"use client";

import { z } from "zod";
import { useForm } from "@tanstack/react-form";
import { useState, useCallback, useEffect } from "react";
import ProfileInfo from "./profile/ProfileInfo";
import SecurityInfo from "./profile/SecurityInfo";
import ProfilePhoto from "./profile/ProfilePhoto";
import { useProfile } from "./profile/hooks/useProfile";
import { toast } from "sonner";

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
  const { data } = useProfile();

  const form = useForm({
    onSubmit: async ({ value }) => {
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

        toast.success("Profile updated successfully", {
          duration: 4000,
          position: "top-center", // you can adjust this if needed
        });

        setIsEditing(false);
        form.reset(value);
      } catch (error) {
        console.error("Error updating profile:", error);
      }
    },
  });

  useEffect(() => {
    if (data) {
      form.setFieldValue("dateOfBirth", data.date_of_birth);
      form.setFieldValue("phone", data.phone);
      form.setFieldValue("profilePhoto", data.profile_photo);
    }
  }, [data, form]);

  const { handleSubmit } = form;

  const handleSave = useCallback(() => {
    handleSubmit();
  }, [handleSubmit]);

  return (
    <div className="max-w-3xl mx-auto">
      <ProfileInfo
        form={form as ReturnType<typeof useForm>}
        handleSave={handleSave}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
      />
      <SecurityInfo
        form={form as ReturnType<typeof useForm>}
        isEditing={isEditing}
      />
      <ProfilePhoto
        isEditing={isEditing}
        form={form as ReturnType<typeof useForm>}
      />
    </div>
  );
}
