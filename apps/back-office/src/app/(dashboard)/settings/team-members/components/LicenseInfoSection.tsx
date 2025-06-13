"use client";

import { Card } from "@mcw/ui";
import { TeamMember } from "../hooks/useRolePermissions";
import EditTeamMemberSidebar from "./EditTeamMemberSidebar";
import LicenseInfoEdit from "./LicenseInfoEdit";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@mcw/ui";
import { showErrorToast } from "@mcw/utils";
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
  clinicianId?: string | null;
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
  const queryClient = useQueryClient();

  // Update license through team-members API
  const updateMutation = useMutation({
    mutationFn: async (data: {
      license: {
        type: string;
        number: string;
        expirationDate: string;
        state: string;
      };
    }) => {
      const response = await fetch(`/api/team-members`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: member.id,
          license: data.license,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update license information");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "License information updated successfully",
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

  // Check if we have any licenses to display
  const hasLicenses = member.licenses && member.licenses.length > 0;

  // Get the first license for the form
  const primaryLicense = hasLicenses ? member.licenses![0] : member.license;

  const handleSubmit = (data: {
    license: {
      type: string;
      number: string;
      expirationDate: string;
      state: string;
    };
  }) => {
    updateMutation.mutate(data);
  };

  const handleSave = () => {
    // Trigger form submission
    const form = document.getElementById(
      "license-info-edit-form",
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
          ) : member.license ? (
            <div className="space-y-4">
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
                  {format(
                    new Date(member.license.expirationDate),
                    "MM/dd/yyyy",
                  )}
                </p>
              </div>
              <div>
                <p className="text-base text-[#4B5563]">State</p>
                <p className="text-base font-medium text-[#1F2937]">
                  {member.license.state}
                </p>
              </div>
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
        isLoading={updateMutation.isPending}
        isOpen={isEditing}
        title="Manage license and degree info"
        onClose={onClose}
        onSave={handleSave}
      >
        <LicenseInfoEdit
          member={{
            ...member,
            license: primaryLicense
              ? {
                  type:
                    "license_type" in primaryLicense
                      ? primaryLicense.license_type
                      : primaryLicense.type || "",
                  number:
                    "license_number" in primaryLicense
                      ? primaryLicense.license_number
                      : primaryLicense.number || "",
                  expirationDate:
                    "expiration_date" in primaryLicense
                      ? primaryLicense.expiration_date
                      : primaryLicense.expirationDate || "",
                  state: primaryLicense.state || "",
                }
              : undefined,
          }}
          onSubmit={handleSubmit}
        />
      </EditTeamMemberSidebar>
    </>
  );
}
