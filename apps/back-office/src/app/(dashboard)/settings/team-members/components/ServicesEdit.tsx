"use client";

import { Label, Badge } from "@mcw/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@mcw/ui";

interface ServicesEditProps {
  member: {
    id: string;
    services?: string[];
  };
  onClose: () => void;
}

export default function ServicesEdit({ member, onClose }: ServicesEditProps) {
  const queryClient = useQueryClient();

  const { mutate: updateServices } = useMutation({
    mutationFn: async (data: { services: string[] }) => {
      const response = await fetch(`/api/clinician/${member.id}/services`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update services");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMember", member.id] });
      toast({
        title: "Success",
        description: "Services updated successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update services",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const selectedServices = Array.from(
      formData.getAll("services"),
    ) as string[];
    updateServices({ services: selectedServices });
  };

  const availableServices = [
    "Individual Therapy",
    "Group Therapy",
    "Family Therapy",
    "Couples Therapy",
    "Child and Adolescent Therapy",
    "Psychological Testing",
    "Medication Management",
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Selected Services</Label>
        <div className="mt-2 space-y-2">
          {availableServices.map((service) => (
            <div key={service} className="flex items-center gap-2">
              <input
                type="checkbox"
                id={service}
                name="services"
                value={service}
                defaultChecked={member.services?.includes(service)}
                className="h-4 w-4 rounded border-gray-300 text-[#2D8467] focus:ring-[#2D8467]"
              />
              <label htmlFor={service} className="text-sm text-gray-700">
                {service}
              </label>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4">
        <Label>Current Services</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {member.services?.map((service) => (
            <Badge
              key={service}
              className="bg-[rgba(45,132,103,0.18)] text-[#1F2937]"
            >
              {service}
            </Badge>
          ))}
        </div>
      </div>
    </form>
  );
}
