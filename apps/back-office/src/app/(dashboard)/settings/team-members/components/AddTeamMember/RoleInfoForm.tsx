"use client";

import { FormControl, FormItem, FormLabel, FormMessage, Card } from "@mcw/ui";
import { useForm } from "@tanstack/react-form";
import {
  TeamMember,
  useRolePermissions,
  RoleType,
} from "@/(dashboard)/settings/team-members/hooks/useRolePermissions";

interface RoleInfoFormProps {
  initialData: Partial<TeamMember>;
  onSubmit: (data: Partial<TeamMember>) => void;
}

export default function RoleInfoForm({
  initialData,
  onSubmit,
}: RoleInfoFormProps) {
  const { getRoleDescription } = useRolePermissions();

  // Role options
  const roleOptions: RoleType[] = [
    "Practice Owner",
    "Practice Administrator",
    "Clinician with entire practice access",
    "Senior Therapist",
    "Practice Supervisor",
    "Practice Biller",
    "Front Desk Staff",
    "Intern/Student",
  ];

  const form = useForm({
    defaultValues: {
      role: initialData.role || "Clinician with entire practice access",
    },
    onSubmit: ({ value }) => {
      onSubmit(value);
    },
  });

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <div className="space-y-1.5">
        <h3 className="text-lg font-semibold text-gray-900">
          Role & Permissions
        </h3>
        <p className="text-sm text-gray-500">
          Select the appropriate role for this team member
        </p>
      </div>

      <form.Field
        name="role"
        validators={{
          onChange: ({ value }) => {
            if (!value) return "Role selection is required";
            return undefined;
          },
        }}
      >
        {(field) => (
          <FormItem className="space-y-3">
            <FormLabel>Role</FormLabel>
            <FormControl>
              <div className="space-y-3">
                {roleOptions.map((role) => (
                  <Card
                    key={role}
                    className={`p-4 cursor-pointer border ${
                      field.state.value === role
                        ? "border-[#2D8467] bg-[#f5fbf9]"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => field.handleChange(role)}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        checked={field.state.value === role}
                        className="h-4 w-4 mt-1 cursor-pointer"
                        id={`role-${role}`}
                        name="role"
                        onChange={() => field.handleChange(role)}
                        type="radio"
                        value={role}
                      />
                      <div className="flex flex-col">
                        <label
                          className="font-medium text-base cursor-pointer"
                          htmlFor={`role-${role}`}
                        >
                          {role}
                        </label>
                        <p className="text-gray-500 text-sm">
                          {getRoleDescription(role as RoleType)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </FormControl>
            {field.state.meta.errors.length > 0 && (
              <FormMessage>{field.state.meta.errors[0]}</FormMessage>
            )}
          </FormItem>
        )}
      </form.Field>

      <div className="flex justify-end">
        <button className="hidden" type="submit" />
      </div>
    </form>
  );
}
