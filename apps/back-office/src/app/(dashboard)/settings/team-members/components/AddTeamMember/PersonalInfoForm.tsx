"use client";

import { useState, useEffect } from "react";
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
    firstName: initialData.firstName || "",
    lastName: initialData.lastName || "",
    email: initialData.email || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when initialData changes
  useEffect(() => {
    setFormData({
      firstName: initialData.firstName || "",
      lastName: initialData.lastName || "",
      email: initialData.email || "",
    });
  }, [initialData]);

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

    // Let the field's ID show through in the DOM for event bubbling
    e.target.id = name;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName) {
      newErrors.lastName = "Last name is required";
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormItem className="space-y-2">
          <FormLabel htmlFor="firstName">First Name</FormLabel>
          <FormControl>
            <Input
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className={errors.firstName ? "border-red-500" : ""}
              placeholder="Enter first name"
            />
          </FormControl>
          {errors.firstName && <FormMessage>{errors.firstName}</FormMessage>}
        </FormItem>

        <FormItem className="space-y-2">
          <FormLabel htmlFor="lastName">Last Name</FormLabel>
          <FormControl>
            <Input
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className={errors.lastName ? "border-red-500" : ""}
              placeholder="Enter last name"
            />
          </FormControl>
          {errors.lastName && <FormMessage>{errors.lastName}</FormMessage>}
        </FormItem>
      </div>

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
