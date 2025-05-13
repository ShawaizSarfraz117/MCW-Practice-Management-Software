"use client";

import { useState } from "react";
import { FormControl, FormItem, FormLabel, FormMessage, Card } from "@mcw/ui";
import {
  TeamMember,
  useRolePermissions,
  RoleType,
} from "../../hooks/useRolePermissions";

interface RoleInfoFormProps {
  initialData: Partial<TeamMember>;
  onSubmit: (data: Partial<TeamMember>) => void;
}

export default function RoleInfoForm({
  initialData,
  onSubmit,
}: RoleInfoFormProps) {
  const [selectedRole, setSelectedRole] = useState<string>(
    initialData.role || "Clinician with entire practice access",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { getRoleDescription } = useRolePermissions();

  const handleRoleChange = (value: string) => {
    setSelectedRole(value);

    // Clear error when role is changed
    if (errors.role) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.role;
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedRole) {
      newErrors.role = "Role selection is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit({ role: selectedRole });
    }
  };

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1.5">
        <h3 className="text-lg font-semibold text-gray-900">
          Role & Permissions
        </h3>
        <p className="text-sm text-gray-500">
          Select the appropriate role for this team member
        </p>
      </div>

      <FormItem className="space-y-3">
        <FormLabel>Role</FormLabel>
        <FormControl>
          <div className="space-y-3">
            {roleOptions.map((role) => (
              <Card
                key={role}
                className={`p-4 cursor-pointer border ${
                  selectedRole === role
                    ? "border-[#2D8467] bg-[#f5fbf9]"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handleRoleChange(role)}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    id={`role-${role}`}
                    name="role"
                    value={role}
                    checked={selectedRole === role}
                    onChange={() => handleRoleChange(role)}
                    className="h-4 w-4 mt-1 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <label
                      htmlFor={`role-${role}`}
                      className="font-medium text-base cursor-pointer"
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
        {errors.role && <FormMessage>{errors.role}</FormMessage>}
      </FormItem>

      <div className="flex justify-end">
        <button
          type="submit"
          className="hidden" // Hidden button to trigger form submission
        />
      </div>
    </form>
  );
}
