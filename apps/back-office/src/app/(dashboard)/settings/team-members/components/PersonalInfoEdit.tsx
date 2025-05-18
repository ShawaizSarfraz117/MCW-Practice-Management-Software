"use client";

import { Input, Label } from "@mcw/ui";

interface PersonalInfoEditProps {
  member: {
    id: string;
    name: string;
    email: string;
  };
  onSubmit: (data: { name: string; email: string }) => void;
}

export default function PersonalInfoEdit({
  member,
  onSubmit,
}: PersonalInfoEditProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    onSubmit({ name, email });
  };

  return (
    <form
      id="personal-info-edit-form"
      className="space-y-4"
      onSubmit={handleSubmit}
    >
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          className="mt-1"
          defaultValue={member.name}
          id="name"
          name="name"
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
