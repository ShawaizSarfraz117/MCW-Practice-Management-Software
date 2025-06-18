"use client";

import { useState } from "react";
import { TeamMember } from "../hooks/useRolePermissions";
import { PersonalInfoSection } from "./PersonalInfoSection";
import { ClinicalInfoSection } from "./ClinicalInfoSection";
import { LicenseInfoSection } from "./LicenseInfoSection";
import { ServicesSection } from "./ServicesSection";
import { RoleInfoSection } from "./RoleInfoSection";

interface EditTeamMemberProps {
  member: TeamMember;
}

export function EditTeamMember({ member }: EditTeamMemberProps) {
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const handleClose = () => {
    setEditingSection(null);
  };

  return (
    <>
      {/* Backdrop overlay */}
      {editingSection && (
        <div aria-hidden="true" className="fixed inset-0 bg-black/30 z-40" />
      )}

      <div className="w-full max-w-7xl mx-auto pt-2 pb-8 px-2 md:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#1F2937]">
            {`${member.firstName} ${member.lastName}`}
          </h1>
          <p className="text-base text-[#4B5563]">
            {member.roles
              ?.map((role) => {
                const roleDisplayMap: Record<string, string> = {
                  ADMIN: "Admin",
                  "ADMIN.PRACTICE-MANAGER": "Admin - Practice Manager",
                  "ADMIN.PRACTICE-BILLER": "Admin - Practice Biller",
                  "CLINICIAN.BASIC": "Clinician - Basic Access",
                  "CLINICIAN.BILLING": "Clinician - Billing Access",
                  "CLINICIAN.FULL-CLIENT-LIST": "Clinician - Full Client List",
                  "CLINICIAN.ENTIRE-PRACTICE": "Clinician - Entire Practice",
                  "CLINICIAN.SUPERVISOR": "Clinician - Supervisor",
                };
                return roleDisplayMap[role] || role;
              })
              .join(", ") || ""}
          </p>
          <button className="text-[#2D8467] text-sm mt-2">
            Watch a quick video about Team members
          </button>
        </div>

        {/* Sections */}
        <PersonalInfoSection
          isEditing={editingSection === "personal"}
          member={member}
          onClose={handleClose}
          onEdit={() => setEditingSection("personal")}
        />
        <ClinicalInfoSection
          isEditing={editingSection === "clinical"}
          member={member}
          onClose={handleClose}
          onEdit={() => setEditingSection("clinical")}
        />
        <LicenseInfoSection
          isEditing={editingSection === "license"}
          member={member}
          onClose={handleClose}
          onEdit={() => setEditingSection("license")}
        />
        <ServicesSection
          isEditing={editingSection === "services"}
          member={member}
          onClose={handleClose}
          onEdit={() => setEditingSection("services")}
        />
        <RoleInfoSection member={member} />
      </div>
    </>
  );
}
