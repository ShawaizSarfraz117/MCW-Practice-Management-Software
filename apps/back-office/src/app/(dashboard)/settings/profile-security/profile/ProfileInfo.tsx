"use client";

import { useState } from "react";
import { Input } from "@mcw/ui";
import { useProfile } from "./hooks/useProfile";
import { ProfileFormType } from "../types";
import { toast } from "@mcw/ui";
import { useQueryClient } from "@tanstack/react-query";

interface FieldProps {
  handleChange: (value: string | null) => void;
}

const ProfileInfo = ({ form }: { form: ProfileFormType }) => {
  const [isEditing, setIsEditing] = useState(false);
  const { data: profileInfo } = useProfile();
  const queryClient = useQueryClient();

  const handleSave = async () => {
    try {
      // Get date value and ensure it's in the correct format
      const dateValue = form.getFieldValue("dateOfBirth");

      // Handle the date properly - ensure it's a valid date or null
      const dateOfBirth =
        dateValue && dateValue !== ""
          ? new Date(dateValue).toISOString().split("T")[0]
          : null;

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateOfBirth,
          // Only include fields relevant to this section
          phone: profileInfo?.phone, // preserve existing phone
          profilePhoto: profileInfo?.profile_photo, // preserve existing profile photo
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

      setIsEditing(false);
      queryClient.refetchQueries({ queryKey: ["profile"] });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error updating profile",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-white rounded-md shadow-sm border border-gray-200 mb-6">
      <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100">
        <h2 className="text-base font-medium text-gray-900">
          SimplePractice profile
        </h2>
        <button
          className="text-blue-600 text-sm font-medium hover:text-blue-700"
          onClick={() => setIsEditing(true)}
        >
          {isEditing ? "" : "Edit"}
        </button>
      </div>
      <div className="px-6 py-5">
        <h3 className="text-base font-medium text-gray-800 mb-3">
          {profileInfo?.name || "User Name"}
        </h3>

        <div>
          <div className="text-sm text-gray-700 mb-1">Date of birth:</div>
          {isEditing ? (
            form.Field({
              name: "dateOfBirth",
              children: (field: FieldProps) => (
                <Input
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-9"
                  max={new Date().toISOString().split("T")[0]}
                  type="date"
                  value={(form.getFieldValue("dateOfBirth") as string) || ""}
                  onChange={(e) => field.handleChange(e.target.value || null)}
                />
              ),
            })
          ) : (
            <div className="text-sm text-gray-900">
              {profileInfo?.date_of_birth
                ? new Date(profileInfo.date_of_birth).toLocaleDateString()
                : "mm/dd/yyyy"}
            </div>
          )}
        </div>

        {isEditing && (
          <div className="flex gap-3 mt-4 justify-end">
            <button
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 bg-blue-600 rounded-md text-sm text-white"
            >
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileInfo;
