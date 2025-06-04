"use client";

import { Card } from "@mcw/ui";
import { TeamMember } from "../hooks/useRolePermissions";
import EditTeamMemberSidebar from "./EditTeamMemberSidebar";
import LicenseInfoEdit from "./LicenseInfoEdit";
import { useUpdateLicenses } from "../services/member.service";
import { format } from "date-fns";
// Extended TeamMember interface to include additional properties
interface ExtendedTeamMember extends TeamMember {
  licenses?: Array<{
    id?: number;
    license_type: string;
    license_number: string;
    expiration_date: string;
    state: string;
  }>;
  clinicalInfoId?: number;
}

interface LicenseInfoSectionProps {
  member: ExtendedTeamMember;
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
  const { mutate: updateLicenses, isPending } = useUpdateLicenses();

  // Check if we have any licenses to display
  const hasLicenses = member.licenses && member.licenses.length > 0;

  const handleSubmit = (data: {
    licenses: Array<{
      id?: number;
      license_type: string;
      license_number: string;
      expiration_date: string;
      state: string;
    }>;
    clinical_info_id: number;
  }) => {
    updateLicenses(data, {
      onSuccess: () => {
        onClose();
      },
    });
  };

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
        <div className="px-6 pb-6">
          {hasLicenses ? (
            <div className="space-y-8">
              {member.licenses?.map((license, index) => (
                <div key={index} className="space-y-4">
                  {index > 0 && <hr className="border-gray-200" />}
                  <div>
                    <p className="text-base text-[#4B5563]">Type</p>
                    <p className="text-base font-medium text-[#1F2937]">
                      {license.license_type}
                    </p>
                  </div>
                  <div>
                    <p className="text-base text-[#4B5563]">License number</p>
                    <p className="text-base font-medium text-[#1F2937]">
                      {license.license_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-base text-[#4B5563]">Expiration date</p>
                    <p className="text-base font-medium text-[#1F2937]">
                      {format(new Date(license.expiration_date), "MM/dd/yyyy")}
                    </p>
                  </div>
                  <div>
                    <p className="text-base text-[#4B5563]">State</p>
                    <p className="text-base font-medium text-[#1F2937]">
                      {license.state}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-base text-[#4B5563]">
              No license information provided
            </p>
          )}
        </div>
      </Card>

      <EditTeamMemberSidebar
        formId="license-info-edit-form"
        isLoading={isPending}
        isOpen={isEditing}
        title="Manage license and degree info"
        onClose={onClose}
      >
        <LicenseInfoEdit
          member={{
            ...member,
            clinicalInfoId: member.clinicalInfoId,
          }}
          onSubmit={handleSubmit}
        />
      </EditTeamMemberSidebar>
    </>
  );
}
