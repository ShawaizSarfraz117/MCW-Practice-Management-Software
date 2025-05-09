"use client";

import { Card } from "@mcw/ui";
import { useState } from "react";
import EditTeamMemberSidebar from "./EditTeamMemberSidebar";
import PersonalInfoEdit from "./PersonalInfoEdit";
import ClinicalInfoEdit from "./ClinicalInfoEdit";
import LicenseInfoEdit from "./LicenseInfoEdit";
import ServicesEdit from "./ServicesEdit";
import RoleInfoEdit from "./RoleInfoEdit";
import {
  TeamMember,
  RoleType,
  useRolePermissions,
} from "../hooks/useRolePermissions";

interface EditTeamMemberProps {
  member: TeamMember;
}

export function EditTeamMember({ member }: EditTeamMemberProps) {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [expandedRoles, setExpandedRoles] = useState<Record<string, boolean>>(
    {},
  );
  const { getRolePermissions, getRoleDescription, ROLE_DESCRIPTIONS } =
    useRolePermissions();

  const handleClose = () => {
    setEditingSection(null);
  };

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
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
          {isExpanded && permissions && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-[#374151] mb-2">
                    Client care
                  </h4>
                  <ul className="space-y-2 text-[#4B5563] text-sm">
                    {permissions.clientCare.map((permission, index) => (
                      <li key={index}>{permission}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-[#374151] mb-2">
                    Operations
                  </h4>
                  <ul className="space-y-2 text-[#4B5563] text-sm">
                    {permissions.operations.map((permission, index) => (
                      <li key={index}>{permission}</li>
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
    <div className="w-full max-w-7xl mx-auto pt-2 pb-8 px-2 md:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#1F2937]">{member.name}</h1>
        <p className="text-base text-[#4B5563]">{member.role}</p>
        <button className="text-[#2D8467] text-sm mt-2">
          Watch a quick video about Team members
        </button>
      </div>

      {/* Personal Info Card */}
      <Card className="mb-6">
        <div className="flex justify-between items-start p-6">
          <h2 className="text-lg font-semibold text-[#1F2937]">
            Personal info
          </h2>
          <button
            className="text-[#2D8467] hover:text-[#256b53]"
            onClick={() => setEditingSection("personal")}
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

      {/* Clinical Info Card */}
      <Card className="mb-6">
        <div className="flex justify-between items-start p-6">
          <h2 className="text-lg font-semibold text-[#1F2937]">
            Clinical info
          </h2>
          <button
            className="text-[#2D8467] hover:text-[#256b53]"
            onClick={() => setEditingSection("clinical")}
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

      {/* License Info Card */}
      <Card className="mb-6">
        <div className="flex justify-between items-start p-6">
          <h2 className="text-lg font-semibold text-[#1F2937]">
            License and degree info
          </h2>
          <button
            className="text-[#2D8467] hover:text-[#256b53]"
            onClick={() => setEditingSection("license")}
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

      {/* Services Card */}
      <Card className="mb-6">
        <div className="flex justify-between items-start p-6">
          <h2 className="text-lg font-semibold text-[#1F2937]">Services</h2>
          <button
            className="text-[#2D8467] hover:text-[#256b53]"
            onClick={() => setEditingSection("services")}
          >
            Edit
          </button>
        </div>
        <div className="px-6 pb-6">
          <div className="flex flex-wrap gap-2">
            {member.services?.map((service, index) => (
              <div
                key={index}
                className="px-4 py-2 bg-[rgba(45,132,103,0.18)] text-[#1F2937] rounded-md"
              >
                {service}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Role Info Card */}
      <Card className="mb-6">
        <div className="flex justify-between items-start p-6">
          <h2 className="text-lg font-semibold text-[#1F2937]">Role info</h2>
          <button
            className="text-[#2D8467] hover:text-[#256b53]"
            onClick={() => setEditingSection("role")}
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

      {/* Edit Sidebars */}
      <EditTeamMemberSidebar
        isOpen={editingSection === "personal"}
        onClose={handleClose}
        title="Edit personal info"
        onSave={() => {
          // The save action is handled by the child component
        }}
      >
        <PersonalInfoEdit member={member} onClose={handleClose} />
      </EditTeamMemberSidebar>

      <EditTeamMemberSidebar
        isOpen={editingSection === "clinical"}
        onClose={handleClose}
        title="Edit clinical info"
        onSave={() => {
          // The save action is handled by the child component
        }}
      >
        <ClinicalInfoEdit member={member} onClose={handleClose} />
      </EditTeamMemberSidebar>

      <EditTeamMemberSidebar
        isOpen={editingSection === "license"}
        onClose={handleClose}
        title="Edit license info"
        onSave={() => {
          // The save action is handled by the child component
        }}
      >
        <LicenseInfoEdit member={member} onClose={handleClose} />
      </EditTeamMemberSidebar>

      <EditTeamMemberSidebar
        isOpen={editingSection === "services"}
        onClose={handleClose}
        title="Edit services"
        onSave={() => {
          // The save action is handled by the child component
        }}
      >
        <ServicesEdit member={member} onClose={handleClose} />
      </EditTeamMemberSidebar>

      <EditTeamMemberSidebar
        isOpen={editingSection === "role"}
        onClose={handleClose}
        title="Edit role info"
        onSave={() => {
          // The save action is handled by the child component
        }}
      >
        <RoleInfoEdit member={member} onClose={handleClose} />
      </EditTeamMemberSidebar>
    </div>
  );
}
