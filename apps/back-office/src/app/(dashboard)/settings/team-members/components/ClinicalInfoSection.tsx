"use client";

import { Card } from "@mcw/ui";
import { TeamMember } from "../hooks/useRolePermissions";
import EditTeamMemberSidebar from "./EditTeamMemberSidebar";
import ClinicalInfoEdit from "./ClinicalInfoEdit";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@mcw/ui";
import { showErrorToast } from "@mcw/utils";

interface ClinicalInfoSectionProps {
  member: TeamMember;
  onEdit: () => void;
  isEditing: boolean;
  onClose: () => void;
}

export function ClinicalInfoSection({
  member,
  onEdit,
  isEditing,
  onClose,
}: ClinicalInfoSectionProps) {
  const queryClient = useQueryClient();

  // Update clinical info through team-members API
  const updateMutation = useMutation({
    mutationFn: async (data: { specialty: string; npiNumber: string }) => {
      const response = await fetch(`/api/team-members`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: member.id,
          specialty: data.specialty,
          npiNumber: data.npiNumber,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update clinical information");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Clinical information updated successfully",
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

  const handleClinicalInfoSubmit = (data: {
    specialty: string;
    npiNumber: string;
  }) => {
    updateMutation.mutate(data);
  };

  const handleSave = () => {
    // Trigger form submission
    const form = document.getElementById(
      "clinical-info-edit-form",
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
            Clinical info
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
            <p className="text-base text-[#4B5563]">Specialty</p>
            <p className="text-base font-medium text-[#1F2937]">
              {member.specialty || "Not specified"}
            </p>
          </div>
          <div>
            <p className="text-base text-[#4B5563]">NPI number</p>
            <p className="text-base font-medium text-[#1F2937]">
              {member.npiNumber || "Not provided"}
            </p>
          </div>
        </div>
      </Card>

      <EditTeamMemberSidebar
        formId="clinical-info-edit-form"
        isLoading={updateMutation.isPending}
        isOpen={isEditing}
        title="Edit clinical info"
        onClose={onClose}
        onSave={handleSave}
      >
        <ClinicalInfoEdit member={member} onSubmit={handleClinicalInfoSubmit} />
      </EditTeamMemberSidebar>
    </>
  );
}
