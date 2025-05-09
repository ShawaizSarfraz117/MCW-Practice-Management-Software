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
        <div className="fixed inset-0 bg-black/30 z-40" aria-hidden="true" />
      )}

      <div className="w-full max-w-7xl mx-auto pt-2 pb-8 px-2 md:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#1F2937]">
            {member.name}
          </h1>
          <p className="text-base text-[#4B5563]">{member.role}</p>
          <button className="text-[#2D8467] text-sm mt-2">
            Watch a quick video about Team members
          </button>
        </div>

        {/* Sections */}
        <PersonalInfoSection
          member={member}
          onEdit={() => setEditingSection("personal")}
          isEditing={editingSection === "personal"}
          onClose={handleClose}
        />
        <ClinicalInfoSection
          member={member}
          onEdit={() => setEditingSection("clinical")}
          isEditing={editingSection === "clinical"}
          onClose={handleClose}
        />
        <LicenseInfoSection
          member={member}
          onEdit={() => setEditingSection("license")}
          isEditing={editingSection === "license"}
          onClose={handleClose}
        />
        <ServicesSection
          member={member}
          onEdit={() => setEditingSection("services")}
          isEditing={editingSection === "services"}
          onClose={handleClose}
        />
        <RoleInfoSection
          member={member}
          onEdit={() => setEditingSection("role")}
          isEditing={editingSection === "role"}
          onClose={handleClose}
        />
      </div>
    </>
  );
}
