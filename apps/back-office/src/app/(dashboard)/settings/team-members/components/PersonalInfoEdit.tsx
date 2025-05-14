"use client";

import { Input, Label } from "@mcw/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@mcw/ui";

interface PersonalInfoEditProps {
  member: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  onClose: () => void;
}

export default function PersonalInfoEdit({
  member,
  onClose,
}: PersonalInfoEditProps) {
  const queryClient = useQueryClient();

  const { mutate: updatePersonalInfo } = useMutation({
    mutationFn: async (data: {
      firstName: string;
      lastName: string;
      email: string;
    }) => {
      const response = await fetch(`/api/clinician/${member.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update personal info");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMember", member.id] });
      toast({
        title: "Success",
        description: "Personal information updated successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update personal information",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updatePersonalInfo({
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <Label htmlFor="firstName">First Name</Label>
        <Input
          className="mt-1"
          defaultValue={member.firstName}
          id="firstName"
          name="firstName"
        />
      </div>
      <div>
        <Label htmlFor="lastName">Last Name</Label>
        <Input
          className="mt-1"
          defaultValue={member.lastName}
          id="lastName"
          name="lastName"
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          className="mt-1"
          defaultValue={member.email}
          id="email"
          name="email"
          type="email"
        />
      </div>
    </form>
  );
}
