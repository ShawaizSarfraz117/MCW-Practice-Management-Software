"use client";

import { Label, Badge } from "@mcw/ui";
import { usePracticeServices } from "../services/member.service";

interface ServicesEditProps {
  member: {
    clinicianId?: string | null;
    services?: string[];
  };
  onSubmit: (data: {
    clinician_id: string;
    service_ids: string[];
    custom_rate?: number | null;
    is_active?: boolean;
  }) => void;
}

export default function ServicesEdit({ member, onSubmit }: ServicesEditProps) {
  // Fetch available practice services from API
  const { data: practiceServices, isLoading } = usePracticeServices();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!member.clinicianId) {
      return;
    }
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const selectedServiceIds = Array.from(
      formData.getAll("services"),
    ) as string[];

    onSubmit({
      clinician_id: member.clinicianId,
      service_ids: selectedServiceIds,
      is_active: true,
    });
  };

  return (
    <form id="services-edit-form" className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <Label>Available Services</Label>
        {isLoading ? (
          <p className="text-sm text-gray-500 mt-2">Loading services...</p>
        ) : (
          <div className="mt-2 space-y-2">
            {practiceServices &&
              practiceServices.map((service) => (
                <div key={service.id} className="flex items-center gap-2">
                  <input
                    className="h-4 w-4 rounded border-gray-300 text-[#2D8467] focus:ring-[#2D8467]"
                    defaultChecked={member.services?.includes(service.type)}
                    id={service.id}
                    name="services"
                    type="checkbox"
                    value={service.id}
                  />
                  <label
                    className="text-sm text-gray-700 cursor-pointer"
                    htmlFor={service.id}
                  >
                    {service.type}
                  </label>
                </div>
              ))}

            {(!practiceServices || practiceServices.length === 0) && (
              <p className="text-sm text-gray-500">No services available</p>
            )}
          </div>
        )}
      </div>

      <div className="mt-4">
        <Label>Current Services</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {member.services?.length ? (
            member.services.map((service) => (
              <Badge
                key={service}
                className="bg-[rgba(45,132,103,0.18)] text-[#1F2937]"
              >
                {service}
              </Badge>
            ))
          ) : (
            <p className="text-sm text-gray-500">No services assigned</p>
          )}
        </div>
      </div>
    </form>
  );
}
