"use client";

import { Card } from "@mcw/ui";
import { TeamMember } from "../hooks/useRolePermissions";
import EditTeamMemberSidebar from "./EditTeamMemberSidebar";
import ClinicalInfoEdit from "./ClinicalInfoEdit";
import { toast } from "@mcw/ui";
import { showErrorToast } from "@mcw/utils";
import { useUpdateTeamMember } from "../services/member.service";

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
  const updateMutation = useUpdateTeamMember();

  const handleMutationSuccess = () => {
    toast({
      title: "Success",
      description: "Clinical information updated successfully",
    });
    onClose();
  };

  const handleMutationError = (error: unknown) => {
    showErrorToast(toast, error);
  };

  const handleClinicalInfoSubmit = (data: {
    specialty: string;
    npiNumber: string;
  }) => {
    updateMutation.mutate(
      {
        id: member.id,
        specialty: data.specialty,
        npiNumber: data.npiNumber,
      },
      {
        onSuccess: handleMutationSuccess,
        onError: handleMutationError,
      },
    );
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
