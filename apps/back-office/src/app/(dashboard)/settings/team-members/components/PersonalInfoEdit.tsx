"use client";

import { Input, Label } from "@mcw/ui";

interface PersonalInfoEditProps {
  member: {
    id: string;
    firstName: string;
    lastName: string;
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
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const name = `${firstName} ${lastName}`.trim();
    onSubmit({ name, email });
  };

  return (
    <form
      className="space-y-4"
      id="personal-info-edit-form"
      onSubmit={handleSubmit}
    >
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
