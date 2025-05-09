import { Card } from "@mcw/ui";
import { TeamMember } from "../hooks/useRolePermissions";
import EditTeamMemberSidebar from "./EditTeamMemberSidebar";
import LicenseInfoEdit from "./LicenseInfoEdit";

interface LicenseInfoSectionProps {
  member: TeamMember;
  onEdit: () => void;
  isEditing: boolean;
  onClose: () => void;
}

export function LicenseInfoSection({
  member,
  onEdit,
  isEditing,
  onClose,
}: LicenseInfoSectionProps) {
  return (
    <>
      <Card className="mb-6">
        <div className="flex justify-between items-start p-6">
          <h2 className="text-lg font-semibold text-[#1F2937]">
            License and degree info
          </h2>
          <button
            className="text-[#2D8467] hover:text-[#256b53]"
            onClick={onEdit}
          >
            Edit
          </button>
        </div>
        <div className="px-6 pb-6 space-y-4">
          {member.license ? (
            <>
              <div>
                <p className="text-base text-[#4B5563]">Type</p>
                <p className="text-base font-medium text-[#1F2937]">
                  {member.license.type}
                </p>
              </div>
              <div>
                <p className="text-base text-[#4B5563]">License number</p>
                <p className="text-base font-medium text-[#1F2937]">
                  {member.license.number}
                </p>
              </div>
              <div>
                <p className="text-base text-[#4B5563]">Expiration date</p>
                <p className="text-base font-medium text-[#1F2937]">
                  {member.license.expirationDate}
                </p>
              </div>
              <div>
                <p className="text-base text-[#4B5563]">State</p>
                <p className="text-base font-medium text-[#1F2937]">
                  {member.license.state}
                </p>
              </div>
            </>
          ) : (
            <p className="text-base text-[#4B5563]">
              No license information provided
            </p>
          )}
        </div>
      </Card>

      <EditTeamMemberSidebar
        isOpen={isEditing}
        onClose={onClose}
        title="Edit license info"
        onSave={() => {
          // The save action is handled by the child component
        }}
      >
        <LicenseInfoEdit member={member} onClose={onClose} />
      </EditTeamMemberSidebar>
    </>
  );
}
