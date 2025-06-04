"use client";

import { Card } from "@mcw/ui";
import { TeamMember } from "../hooks/useRolePermissions";
import EditTeamMemberSidebar from "./EditTeamMemberSidebar";
import PersonalInfoEdit from "./PersonalInfoEdit";
import { useCreateOrUpdateTeamMember } from "../services/member.service";
import { toast } from "@mcw/ui";

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
  const { mutate: updatePersonalInfo, isPending } =
    useCreateOrUpdateTeamMember();

  const handlePersonalInfoSubmit = (data: { name: string; email: string }) => {
    // Extract first and last name
    const nameParts = (data.name || "").trim().split(" ");
    const first_name = nameParts[0] || "";
    const last_name = nameParts.slice(1).join(" ") || "";

    updatePersonalInfo(
      {
        id: member.id,
        data: {
          first_name,
          last_name,
          email: data.email,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Personal information updated successfully",
          });
          onClose();
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: "Failed to update personal information",
            variant: "destructive",
          });
          console.error(error);
        },
      },
    );
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
              {member.firstName || "No name found"}
            </p>
          </div>
          <div>
            <p className="text-base text-[#4B5563]">Email</p>
            <p className="text-base font-medium text-[#1F2937]">
              {member.email || "No email found"}
            </p>
          </div>
        </div>
      </Card>

      <EditTeamMemberSidebar
        formId="personal-info-edit-form"
        isLoading={isPending}
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
