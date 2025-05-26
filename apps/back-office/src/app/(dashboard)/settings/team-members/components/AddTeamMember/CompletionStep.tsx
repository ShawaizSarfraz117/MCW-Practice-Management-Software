"use client";

import { Button } from "@mcw/ui";
import { CheckCircle2 } from "lucide-react";
import { TeamMember, useRolePermissions } from "../../hooks/useRolePermissions";
import { isClinicianWithSubroles } from "../../utils/roleUtils";

interface CompletionStepProps {
  teamMemberData: Partial<TeamMember> & { role?: string };
  onClose: () => void;
}

export default function CompletionStep({
  teamMemberData,
  onClose,
}: CompletionStepProps) {
  const fullName =
    `${teamMemberData.firstName || ""} ${teamMemberData.lastName || ""}`.trim();

  const { getClinicianLevelDescription } = useRolePermissions();

  // Get roles from either roles array or single role for backward compatibility
  const roles = Array.isArray(teamMemberData.roles)
    ? teamMemberData.roles
    : teamMemberData.role
      ? [teamMemberData.role]
      : [];

  // Format roles for display in text
  const rolesDisplay =
    roles.length > 1
      ? `${roles.slice(0, -1).join(", ")} and ${roles[roles.length - 1]}`
      : roles[0] || "team member";

  // Check if specific Clinician role is present (not Supervisor)
  const hasClinicianWithLevels = roles.some((role) =>
    isClinicianWithSubroles(role),
  );

  return (
    <div className="flex flex-col items-center py-6 text-center space-y-4">
      <div className="rounded-full bg-green-50 p-3">
        <CheckCircle2 className="h-12 w-12 text-[#2D8467]" />
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-gray-900">
          Team Member Created Successfully
        </h3>
        <p className="text-gray-600 max-w-md">
          {fullName} has been added to your team with{" "}
          {roles.length > 1 ? "multiple roles" : "the role of"} {rolesDisplay}.
        </p>
      </div>

      <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 w-full mt-6 max-w-md">
        <div className="flex flex-col space-y-3 text-left">
          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-medium">{fullName}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium">{teamMemberData.email}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Roles</p>
            <div className="mt-1 space-y-2">
              {teamMemberData.roleCategories?.map((roleCategory, index) => (
                <div key={index} className="space-y-1">
                  <p className="font-medium">{roleCategory.roleTitle}</p>
                  <p className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md inline-block">
                    {roleCategory.category}
                  </p>
                </div>
              )) ||
                roles.map((role, index) => (
                  <div key={index} className="font-medium">
                    {role}
                  </div>
                ))}
            </div>
          </div>

          {/* Show clinician level only if the Clinician role is selected (not Supervisor) */}
          {hasClinicianWithLevels && teamMemberData.clinicianLevel && (
            <div>
              <p className="text-sm text-gray-500">Clinician Level</p>
              <p className="font-medium">{teamMemberData.clinicianLevel}</p>
              <p className="text-xs text-gray-500 mt-1">
                {getClinicianLevelDescription(teamMemberData.clinicianLevel)}
              </p>
            </div>
          )}

          {teamMemberData.specialty && (
            <div>
              <p className="text-sm text-gray-500">Specialty</p>
              <p className="font-medium">{teamMemberData.specialty}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex space-x-3 w-full justify-center">
        <Button
          className="bg-[#2D8467] text-white hover:bg-[#256b53]"
          onClick={onClose}
        >
          Done
        </Button>
        <Button variant="outline">View Team Member</Button>
      </div>
    </div>
  );
}
