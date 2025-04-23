"use client";

import { z } from "zod";
import { useForm } from "@mcw/ui";
import { useState, useCallback } from "react";
import ProfileHeader from "./profile/ProfileHeader";
import ProfileInfo from "./profile/ProfileInfo";
import ProfilePhoto from "./profile/ProfilePhoto";
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

  const form = useForm({
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

  const { handleSubmit } = form;

  const handleSave = useCallback(() => {
    handleSubmit();
  }, [handleSubmit]);

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
