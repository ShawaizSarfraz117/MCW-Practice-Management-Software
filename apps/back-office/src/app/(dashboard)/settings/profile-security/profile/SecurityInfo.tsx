"use client";

import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { useSession } from "next-auth/react";
import { Input } from "@mcw/ui";
import { useProfile } from "./hooks/useProfile";
import { ProfileFormType } from "../types";
import { toast } from "@mcw/ui";
import { useQueryClient } from "@tanstack/react-query";

interface FieldProps {
  handleChange: (value: string | null) => void;
}

const phoneRegex = /^[- +()0-9]*$/;

const SecurityInfo = ({ form }: { form: ProfileFormType }) => {
  const [isEditing, setIsEditing] = useState(false);
  const { data: session } = useSession();
  const { data: profileInfo } = useProfile();
  const queryClient = useQueryClient();

  const handleSave = async () => {
    try {
      const phone = form.getFieldValue("phone");
      // Validate phone number before submitting
      if (phone && !phoneRegex.test(phone)) {
        toast({
          title: "Invalid phone number",
          description: "Only valid phone numbers are allowed.",
          variant: "destructive",
        });
        return;
      }
      // Get the current date of birth value
      const dateOfBirth = form.getFieldValue("dateOfBirth");

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          // Use the form value rather than the API response to maintain format consistency
          dateOfBirth: dateOfBirth,
          profilePhoto: profileInfo?.profile_photo, // preserve existing profile photo
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        throw new Error(errorData.details || "Failed to update profile");
      }

      toast({
        title: "Security information updated successfully",
        variant: "success",
      });

      setIsEditing(false);
      queryClient.refetchQueries({ queryKey: ["profile"] });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error updating security information",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-white rounded-md shadow-sm border border-gray-200 mb-6">
      <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100">
        <h2 className="text-base font-medium text-gray-900">
          SimplePractice security
        </h2>
        <button
          className="text-blue-600 text-sm hover:text-blue-700 font-medium"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? "Cancel" : "Manage"}
        </button>
      </div>
      <div className="px-6 py-5">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-700">Email:</div>
            <div className="text-sm text-gray-900">{session?.user?.email}</div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 rounded-full bg-gray-100 items-center justify-center">
              <ShieldAlert className="h-3 w-3 text-gray-500" />
            </div>
            <span className="text-sm text-gray-500">
              2-step verification off
            </span>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-700">Phone:</div>
            {isEditing ? (
              <div className="w-1/2">
                {form.Field({
                  name: "phone",
                  children: (field: FieldProps) => (
                    <Input
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-9"
                      type="tel"
                      value={(form.getFieldValue("phone") as string) || ""}
                      placeholder="Enter phone number"
                      onChange={(e) =>
                        field.handleChange(e.target.value || null)
                      }
                    />
                  ),
                })}
              </div>
            ) : (
              <div className="text-sm text-gray-900">
                {profileInfo?.phone || "(XXX) XXX-XXXX"}
              </div>
            )}
          </div>

          <div>
            <div className="text-sm text-gray-700">
              Password last changed on February 6, 2025
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end">
              <button
                className="px-3 py-1.5 bg-blue-600 rounded-md text-sm text-white"
                onClick={handleSave}
              >
                Save
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityInfo;
