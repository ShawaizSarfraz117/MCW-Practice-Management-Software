"use client";

import { useState } from "react";
import { Input, FormControl, FormItem, FormLabel, FormMessage } from "@mcw/ui";
import { TeamMember } from "../../hooks/useRolePermissions";

interface PersonalInfoFormProps {
  initialData: Partial<TeamMember>;
  onSubmit: (data: Partial<TeamMember>) => void;
}

export default function PersonalInfoForm({
  initialData,
  onSubmit,
}: PersonalInfoFormProps) {
  const [formData, setFormData] = useState({
    name: initialData.name || "",
    email: initialData.email || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when field is changed
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) {
      newErrors.name = "Name is required";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1.5">
        <h3 className="text-lg font-semibold text-gray-900">
          Personal Information
        </h3>
        <p className="text-sm text-gray-500">
          Enter the team member's basic information
        </p>
      </div>

      <FormItem className="space-y-2">
        <FormLabel htmlFor="name">Name</FormLabel>
        <FormControl>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={errors.name ? "border-red-500" : ""}
            placeholder="Enter full name"
          />
        </FormControl>
        {errors.name && <FormMessage>{errors.name}</FormMessage>}
      </FormItem>

      <FormItem className="space-y-2">
        <FormLabel htmlFor="email">Email</FormLabel>
        <FormControl>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className={errors.email ? "border-red-500" : ""}
            placeholder="Enter email address"
          />
        </FormControl>
        {errors.email && <FormMessage>{errors.email}</FormMessage>}
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
