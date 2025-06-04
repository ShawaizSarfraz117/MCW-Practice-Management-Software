import { useRef } from "react";
import {
  hasClinicianRole,
  isClinicianWithSubroles,
} from "../../utils/roleUtils";
import {
  useRolePermissions,
  ClinicianLevel,
} from "../../hooks/useRolePermissions";

// Define the TeamMember type inline to avoid import issues
interface TeamMember {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  roles?: string[];
  role?: string; // For backward compatibility
  specialty?: string;
  npiNumber?: string;
  license?: {
    type: string;
    number: string;
    expirationDate: string;
    state: string;
  };
  services?: string[];
  clinicianLevel?: ClinicianLevel;
}

interface TeamMemberSummaryProps {
  teamMemberData: Partial<TeamMember>;
  isHidden: boolean;
}

export default function TeamMemberSummary({
  teamMemberData,
  isHidden,
}: TeamMemberSummaryProps) {
  const summaryRef = useRef<HTMLDivElement>(null);
  const { getClinicianLevelDescription } = useRolePermissions();

  const fullName =
    `${teamMemberData.firstName || ""} ${teamMemberData.lastName || ""}`.trim();

  // Get roles from either roles array or single role for backward compatibility
  // Ensure roles is always an array
  const roles = Array.isArray(teamMemberData.roles)
    ? teamMemberData.roles
    : teamMemberData.role
      ? [teamMemberData.role]
      : [];

  // Determine if any of the selected roles is a clinician role
  const isClinician = hasClinicianRole(roles);

  // Check specifically for the new Clinician role
  const hasNewClinicianRole = roles.some((role) =>
    isClinicianWithSubroles(role),
  );

  // Format the role names for display
  const formatRoleName = (role: string) => {
    if (role === "Clinician") {
      if (teamMemberData.clinicianLevel) {
        return `Clinician (${teamMemberData.clinicianLevel})`;
      }
      return role;
    }
    return role;
  };

  // Group roles by category
  const clinicianRoles = roles.filter((role) => hasClinicianRole([role]));
  const adminRoles = roles.filter((role) => !hasClinicianRole([role]));

  return (
    <div className={`${isHidden ? "hidden" : ""} lg:relative`}>
      <div
        ref={summaryRef}
        className="bg-white rounded-lg border border-gray-200 shadow-sm lg:sticky lg:top-4"
      >
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            Team Member Summary
          </h3>
        </div>
        <div className="px-6 py-4 space-y-4">
          {roles.length > 0 ? (
            <>
              <div>
                <p className="text-sm font-medium text-gray-700">Roles</p>
                {clinicianRoles.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Clinical
                    </p>
                    <ul className="space-y-1">
                      {clinicianRoles.map((role, index) => (
                        <li
                          key={index}
                          className="text-sm text-gray-900 flex items-start"
                        >
                          <span className="text-[#2D8467] mr-1.5">•</span>
                          {formatRoleName(role)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {adminRoles.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Administrative
                    </p>
                    <ul className="space-y-1">
                      {adminRoles.map((role, index) => (
                        <li
                          key={index}
                          className="text-sm text-gray-900 flex items-start"
                        >
                          <span className="text-[#2D8467] mr-1.5">•</span>
                          {formatRoleName(role)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Show clinician level if Clinician role is selected */}
              {hasNewClinicianRole && teamMemberData.clinicianLevel && (
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Clinician Access Level
                  </p>
                  <p className="text-sm text-gray-900 mt-1">
                    {teamMemberData.clinicianLevel}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {getClinicianLevelDescription(
                      teamMemberData.clinicianLevel,
                    )}
                  </p>
                </div>
              )}
            </>
          ) : null}

          {fullName && (
            <div>
              <p className="text-sm font-medium text-gray-700">Name</p>
              <p className="text-sm text-gray-900 mt-1">{fullName}</p>
            </div>
          )}

          {teamMemberData.email && (
            <div>
              <p className="text-sm font-medium text-gray-700">Email</p>
              <p className="text-sm text-gray-900 mt-1 break-all">
                {teamMemberData.email}
              </p>
            </div>
          )}

          {/* Only show clinician-specific fields if any clinician role is selected */}
          {isClinician && (
            <>
              {teamMemberData.specialty && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Specialty</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {teamMemberData.specialty}
                  </p>
                </div>
              )}

              {teamMemberData.npiNumber && (
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    NPI Number
                  </p>
                  <p className="text-sm text-gray-900 mt-1">
                    {teamMemberData.npiNumber}
                  </p>
                </div>
              )}

              {teamMemberData.license?.type && (
                <div>
                  <p className="text-sm font-medium text-gray-700">License</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {teamMemberData.license.type}{" "}
                    {teamMemberData.license.state &&
                      `(${teamMemberData.license.state})`}
                    {teamMemberData.license.number &&
                      ` #${teamMemberData.license.number}`}
                  </p>
                  {teamMemberData.license.expirationDate && (
                    <p className="text-xs text-gray-500 mt-1">
                      Expires: {teamMemberData.license.expirationDate}
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {!fullName && !teamMemberData.email && roles.length === 0 && (
            <p className="text-gray-500 italic">
              Complete the form to see the team member details here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
