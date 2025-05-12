"use client";

import { useState } from "react";
import { Input, FormControl, FormItem, FormLabel, FormMessage } from "@mcw/ui";
import { TeamMember } from "../../hooks/useRolePermissions";

interface ClinicalInfoFormProps {
  initialData: Partial<TeamMember>;
  onSubmit: (data: Partial<TeamMember>) => void;
}

export default function ClinicalInfoForm({
  initialData,
  onSubmit,
}: ClinicalInfoFormProps) {
  const [formData, setFormData] = useState({
    specialty: initialData.specialty || "",
    npiNumber: initialData.npiNumber || "",
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

    if (!formData.specialty) {
      newErrors.specialty = "Specialty is required";
    }

    if (formData.npiNumber && !/^\d{10}$/.test(formData.npiNumber)) {
      newErrors.npiNumber = "NPI Number must be 10 digits";
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
          Clinical Information
        </h3>
        <p className="text-sm text-gray-500">
          Enter the team member's clinical details
        </p>
      </div>

      <FormItem className="space-y-2">
        <FormLabel htmlFor="specialty">Specialty</FormLabel>
        <FormControl>
          <Input
            id="specialty"
            name="specialty"
            value={formData.specialty}
            onChange={handleChange}
            className={errors.specialty ? "border-red-500" : ""}
            placeholder="e.g., Behavioral health therapy"
          />
        </FormControl>
        {errors.specialty && <FormMessage>{errors.specialty}</FormMessage>}
      </FormItem>

      <FormItem className="space-y-2">
        <FormLabel htmlFor="npiNumber">NPI Number</FormLabel>
        <FormControl>
          <Input
            id="npiNumber"
            name="npiNumber"
            value={formData.npiNumber}
            onChange={handleChange}
            className={errors.npiNumber ? "border-red-500" : ""}
            placeholder="Enter 10-digit NPI number"
          />
        </FormControl>
        {errors.npiNumber && <FormMessage>{errors.npiNumber}</FormMessage>}
        <p className="text-xs text-gray-500">
          National Provider Identifier - 10 digit unique identification number
        </p>
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
