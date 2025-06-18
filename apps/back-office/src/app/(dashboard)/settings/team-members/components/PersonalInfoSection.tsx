"use client";

import { Card } from "@mcw/ui";
import { TeamMember } from "../hooks/useRolePermissions";
import EditTeamMemberSidebar from "./EditTeamMemberSidebar";
import PersonalInfoEdit from "./PersonalInfoEdit";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@mcw/ui";
import { showErrorToast } from "@mcw/utils";

interface PersonalInfoSectionProps {
  member: TeamMember;
  onEdit: () => void;
  isEditing: boolean;
  onClose: () => void;
}

export function PersonalInfoSection({
  member,
  onEdit,
  isEditing,
  onClose,
}: PersonalInfoSectionProps) {
  const queryClient = useQueryClient();

  // Update personal info through team-members API
  const updateMutation = useMutation({
    mutationFn: async (data: { name: string; email: string }) => {
      // Extract first and last name
      const nameParts = (data.name || "").trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const response = await fetch(`/api/team-members`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: member.id,
          firstName,
          lastName,
          email: data.email,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update personal information");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Personal information updated successfully",
      });
      queryClient.invalidateQueries({
        queryKey: ["clinician-details", member.id],
      });
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      onClose();
    },
    onError: (error: unknown) => {
      showErrorToast(toast, error);
    },
  });

  const handlePersonalInfoSubmit = (data: { name: string; email: string }) => {
    updateMutation.mutate(data);
  };

  const handleSave = () => {
    // Trigger form submission
    const form = document.getElementById(
      "personal-info-edit-form",
    ) as HTMLFormElement;
    if (form) {
      form.requestSubmit();
    }
  };

  return (
    <>
      <Card className="mb-6">
        <div className="flex justify-between items-start p-6">
          <h2 className="text-lg font-semibold text-[#1F2937]">
            Personal info
          </h2>
          <button
            className="text-[#2D8467] hover:text-[#256b53]"
            onClick={onEdit}
          >
            Edit
          </button>
        </div>
        <div className="px-6 pb-6 space-y-4">
          <div>
            <p className="text-base text-[#4B5563]">Name</p>
            <p className="text-base font-medium text-[#1F2937]">
              {member.firstName} {member.lastName}
            </p>
          </div>
          <div>
            <p className="text-base text-[#4B5563]">Email</p>
            <p className="text-base font-medium text-[#1F2937]">
              {member.email}
            </p>
          </div>
        </div>
      </Card>

      <EditTeamMemberSidebar
        formId="personal-info-edit-form"
        isLoading={updateMutation.isPending}
        isOpen={isEditing}
        title="Edit personal info"
        onClose={onClose}
        onSave={handleSave}
      >
        <PersonalInfoEdit member={member} onSubmit={handlePersonalInfoSubmit} />
      </EditTeamMemberSidebar>
    </>
  );
}
