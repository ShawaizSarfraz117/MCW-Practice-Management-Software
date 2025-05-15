"use client";

import { Input, Label } from "@mcw/ui";

interface ClinicalInfoEditProps {
  member: {
    id: string;
    specialty?: string;
    npiNumber?: string;
  };
  onSubmit: (data: { specialty: string; npiNumber: string }) => void;
}

export default function ClinicalInfoEdit({
  member,
  onSubmit,
}: ClinicalInfoEditProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const specialty = formData.get("specialty") as string;
    const npiNumber = formData.get("npiNumber") as string;

    onSubmit({ specialty, npiNumber });
  };

  return (
    <form
      className="space-y-4"
      id="clinical-info-edit-form"
      onSubmit={handleSubmit}
    >
      <div>
        <Label htmlFor="specialty">Specialty</Label>
        <Input
          className="mt-1"
          defaultValue={member.specialty || ""}
          id="specialty"
          name="specialty"
          placeholder="Enter specialty"
        />
      </div>
      <div>
        <Label htmlFor="npiNumber">NPI Number</Label>
        <Input
          className="mt-1"
          defaultValue={member.npiNumber || ""}
          id="npiNumber"
          name="npiNumber"
          placeholder="Enter NPI number"
        />
      </div>
    </form>
  );
}
