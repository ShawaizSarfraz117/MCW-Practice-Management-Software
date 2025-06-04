"use client";

import { Card } from "@mcw/ui";
import { TeamMember } from "../hooks/useRolePermissions";
import EditTeamMemberSidebar from "./EditTeamMemberSidebar";
import ServicesEdit from "./ServicesEdit";
import { useUpdateClinicianServices } from "../services/member.service";

interface ServicesSectionProps {
  member: TeamMember;
  onEdit: () => void;
  isEditing: boolean;
  onClose: () => void;
}

export function ServicesSection({
  member,
  onEdit,
  isEditing,
  onClose,
}: ServicesSectionProps) {
  const { mutate: updateServices, isPending } = useUpdateClinicianServices();

  const handleSubmit = (data: {
    clinician_id: string;
    service_ids: string[];
    custom_rate?: number | null;
    is_active?: boolean;
  }) => {
    updateServices(data, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <>
      <Card className="mb-6">
        <div className="flex justify-between items-start p-6">
          <h2 className="text-lg font-semibold text-[#1F2937]">Services</h2>
          <button
            className="text-[#2D8467] hover:text-[#256b53]"
            onClick={onEdit}
          >
            Edit
          </button>
        </div>
        <div className="px-6 pb-6">
          {member.services && member.services.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {member.services.map((service, index) => (
                <div
                  key={index}
                  className="px-4 py-2 bg-[rgba(45,132,103,0.18)] text-[#1F2937] rounded-md"
                >
                  {service}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-base text-[#4B5563]">No services assigned</p>
          )}
        </div>
      </Card>

      <EditTeamMemberSidebar
        formId="services-edit-form"
        isLoading={isPending}
        isOpen={isEditing}
        title="Edit services"
        onClose={onClose}
      >
        <ServicesEdit member={member} onSubmit={handleSubmit} />
      </EditTeamMemberSidebar>
    </>
  );
}
