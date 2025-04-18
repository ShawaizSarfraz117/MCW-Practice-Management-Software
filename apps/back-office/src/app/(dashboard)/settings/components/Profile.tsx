"use client";

import { z } from "zod";
import { useForm } from "@tanstack/react-form";
import { useState, useCallback, useEffect } from "react";
import ProfileInfo from "./profile/ProfileInfo";
import SecurityInfo from "./profile/SecurityInfo";
import ProfilePhoto from "./profile/ProfilePhoto";
import { useProfile } from "./hooks/useProfile";

export const profileSchema = z.object({
  dateOfBirth: z.string().optional().nullable(),
  phone: z.string().min(10).max(20).optional().nullable(),
  profilePhoto: z.string().url().max(500).optional().nullable(),
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
    defaultValues: () => ({
      dateOfBirth: data?.date_of_birth,
      phone: data?.phone,
      profilePhoto: data?.profile_photo,
    }),
    onSubmit: async ({ value }) => {
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
  }, [data]);

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
      <ProfilePhoto form={form as ReturnType<typeof useForm>} />
    </div>
  );
}
