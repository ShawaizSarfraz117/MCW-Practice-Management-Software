import { Card } from "@mcw/ui";
import { TeamMember } from "../hooks/useRolePermissions";
import EditTeamMemberSidebar from "./EditTeamMemberSidebar";
import PersonalInfoEdit from "./PersonalInfoEdit";

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
              {member.name}
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
        isOpen={isEditing}
        title="Edit personal info"
        onSave={() => {
          // The save action is handled by the child component
        }}
        onClose={onClose}
      >
        <PersonalInfoEdit member={member} onClose={onClose} />
      </EditTeamMemberSidebar>
    </>
  );
}
