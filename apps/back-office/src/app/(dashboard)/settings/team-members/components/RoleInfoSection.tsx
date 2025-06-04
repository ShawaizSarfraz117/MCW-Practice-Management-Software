import { Card } from "@mcw/ui";
import { useState } from "react";
import {
  TeamMember,
  RoleType,
  useRolePermissions,
} from "../hooks/useRolePermissions";
import EditRoleModal from "./EditRoleModal";

interface RoleInfoSectionProps {
  member: TeamMember;
}

export function RoleInfoSection({ member }: RoleInfoSectionProps) {
  const [expandedRoles, setExpandedRoles] = useState<Record<string, boolean>>(
    {},
  );
  const { getRolePermissions, getRoleDescription, ROLE_DESCRIPTIONS } =
    useRolePermissions();
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);

  const toggleRolePermissions = (role: string) => {
    setExpandedRoles((prev) => ({
      ...prev,
      [role]: !prev[role],
    }));
  };

  const renderRoleCard = (role: RoleType) => {
    const permissions = getRolePermissions(role);
    const description = getRoleDescription(role);
    const isExpanded = expandedRoles[role] || false;

    return (
      <div key={role} className="space-y-4">
        <div className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-base font-medium text-[#1F2937]">{role}</p>
              <p className="text-sm text-[#6B7280] mt-1">{description}</p>
            </div>
            <button
              className="text-[#4B5563] text-sm flex items-center gap-1"
              onClick={() => toggleRolePermissions(role)}
            >
              {isExpanded ? "Hide" : "Show"} permissions
              <svg
                className={`w-4 h-4 transition-transform ${
                  isExpanded ? "transform rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M19 9l-7 7-7-7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </button>
          </div>
          {isExpanded && permissions && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="space-y-6">
                {/* Client care section */}
                <div>
                  <h4 className="text-sm font-medium text-[#374151] bg-[#F9FAFB] px-4 py-2 rounded-md shadow-sm">
                    Client care
                  </h4>
                  <ul className="mt-2 space-y-2">
                    {permissions.clientCare.map((permission, index) => (
                      <li
                        key={index}
                        className="flex justify-between items-center px-4"
                      >
                        <span className="text-sm text-[#4B5563]">
                          {permission}
                        </span>
                        <div className="flex items-center gap-2 text-[#4B5563]">
                          <svg
                            fill="none"
                            height="16"
                            viewBox="0 0 16 16"
                            width="16"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M8 8C9.933 8 11.5 6.433 11.5 4.5C11.5 2.567 9.933 1 8 1C6.067 1 4.5 2.567 4.5 4.5C4.5 6.433 6.067 8 8 8Z"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.5"
                            />
                            <path
                              d="M13.5234 15C13.5234 12.2975 11.0359 10.1125 7.99844 10.1125C4.96094 10.1125 2.47344 12.2975 2.47344 15"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.5"
                            />
                          </svg>
                          <span className="text-sm">Entire practice</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Billing section */}
                <div>
                  <h4 className="text-sm font-medium text-[#374151] bg-[#F9FAFB] px-4 py-2 rounded-md shadow-sm">
                    Billing
                  </h4>
                  <ul className="mt-2 space-y-2">
                    {permissions.operations.map((permission, index) => (
                      <li
                        key={index}
                        className="flex justify-between items-center px-4"
                      >
                        <span className="text-sm text-[#4B5563]">
                          {permission}
                        </span>
                        <div className="flex items-center gap-2 text-[#4B5563]">
                          <svg
                            fill="none"
                            height="16"
                            viewBox="0 0 16 16"
                            width="16"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M8 8C9.933 8 11.5 6.433 11.5 4.5C11.5 2.567 9.933 1 8 1C6.067 1 4.5 2.567 4.5 4.5C4.5 6.433 6.067 8 8 8Z"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.5"
                            />
                            <path
                              d="M13.5234 15C13.5234 12.2975 11.0359 10.1125 7.99844 10.1125C4.96094 10.1125 2.47344 12.2975 2.47344 15"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.5"
                            />
                          </svg>
                          <span className="text-sm">Entire practice</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Card className="mb-6">
        <div className="flex justify-between items-start p-6">
          <h2 className="text-lg font-semibold text-[#1F2937]">Role info</h2>
          <button
            className="text-[#2D8467] hover:text-[#256b53]"
            onClick={() => setShowEditRoleModal(true)}
          >
            Edit
          </button>
        </div>
        <div className="px-6 pb-6">
          <div className="space-y-4">
            {Object.keys(ROLE_DESCRIPTIONS).map((role) =>
              renderRoleCard(role as RoleType),
            )}
          </div>
        </div>
      </Card>
      <EditRoleModal
        member={member}
        open={showEditRoleModal}
        onClose={() => setShowEditRoleModal(false)}
      />
    </>
  );
}
