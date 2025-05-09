"use client";

import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mcw/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@mcw/ui";

interface ClinicalInfoEditProps {
  member: {
    id: string;
    specialty?: string;
    npiNumber?: string;
  };
  onClose: () => void;
}

export default function ClinicalInfoEdit({
  member,
  onClose,
}: ClinicalInfoEditProps) {
  const queryClient = useQueryClient();

  const { mutate: updateClinicalInfo } = useMutation({
    mutationFn: async (data: { specialty: string; npiNumber: string }) => {
      const response = await fetch(`/api/clinician/${member.id}/clinical`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update clinical info");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMember", member.id] });
      toast({
        title: "Success",
        description: "Clinical information updated successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update clinical information",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateClinicalInfo({
      specialty: formData.get("specialty") as string,
      npiNumber: formData.get("npiNumber") as string,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="specialty">Specialty</Label>
        <Select name="specialty" defaultValue={member.specialty}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select specialty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="behavioral-health">
              Behavioral Health Therapy
            </SelectItem>
            <SelectItem value="clinical-psychology">
              Clinical Psychology
            </SelectItem>
            <SelectItem value="psychiatry">Psychiatry</SelectItem>
            <SelectItem value="counseling">Counseling</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="npiNumber">NPI Number</Label>
        <Input
          id="npiNumber"
          name="npiNumber"
          defaultValue={member.npiNumber}
          className="mt-1"
          placeholder="Enter NPI number"
        />
      </div>
    </form>
  );
}
