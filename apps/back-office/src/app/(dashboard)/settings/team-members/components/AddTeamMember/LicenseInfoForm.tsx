"use client";

import { useState } from "react";
import {
  Input,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mcw/ui";
import { TeamMember } from "../../hooks/useRolePermissions";

interface LicenseInfoFormProps {
  initialData: Partial<TeamMember>;
  onSubmit: (data: Partial<TeamMember>) => void;
}

export default function LicenseInfoForm({
  initialData,
  onSubmit,
}: LicenseInfoFormProps) {
  const [formData, setFormData] = useState({
    license: {
      type: initialData.license?.type || "",
      number: initialData.license?.number || "",
      expirationDate: initialData.license?.expirationDate || "",
      state: initialData.license?.state || "",
    },
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const licenseTypes = [
    "LMFT", // Licensed Marriage and Family Therapist
    "LCSW", // Licensed Clinical Social Worker
    "LPC", // Licensed Professional Counselor
    "LMHC", // Licensed Mental Health Counselor
    "LP", // Licensed Psychologist
    "MD", // Medical Doctor
    "DO", // Doctor of Osteopathic Medicine
    "PMHNP", // Psychiatric Mental Health Nurse Practitioner
    "PA", // Physician Assistant
  ];

  const states = [
    "AL",
    "AK",
    "AZ",
    "AR",
    "CA",
    "CO",
    "CT",
    "DE",
    "FL",
    "GA",
    "HI",
    "ID",
    "IL",
    "IN",
    "IA",
    "KS",
    "KY",
    "LA",
    "ME",
    "MD",
    "MA",
    "MI",
    "MN",
    "MS",
    "MO",
    "MT",
    "NE",
    "NV",
    "NH",
    "NJ",
    "NM",
    "NY",
    "NC",
    "ND",
    "OH",
    "OK",
    "OR",
    "PA",
    "RI",
    "SC",
    "SD",
    "TN",
    "TX",
    "UT",
    "VT",
    "VA",
    "WA",
    "WV",
    "WI",
    "WY",
    "DC",
    "PR",
    "VI",
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      license: {
        ...prev.license,
        [name]: value,
      },
    }));

    // Clear error when field is changed
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      license: {
        ...prev.license,
        [name]: value,
      },
    }));

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

    if (!formData.license.type) {
      newErrors.type = "License type is required";
    }

    if (!formData.license.number) {
      newErrors.number = "License number is required";
    }

    if (!formData.license.state) {
      newErrors.state = "State is required";
    }

    if (!formData.license.expirationDate) {
      newErrors.expirationDate = "Expiration date is required";
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
          License Information
        </h3>
        <p className="text-sm text-gray-500">
          Enter the team member's professional license details
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormItem className="space-y-2">
          <FormLabel htmlFor="type">License Type</FormLabel>
          <Select
            value={formData.license.type}
            onValueChange={(value) => handleSelectChange("type", value)}
          >
            <FormControl>
              <SelectTrigger className={errors.type ? "border-red-500" : ""}>
                <SelectValue placeholder="Select license type" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {licenseTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.type && <FormMessage>{errors.type}</FormMessage>}
        </FormItem>

        <FormItem className="space-y-2">
          <FormLabel htmlFor="number">License Number</FormLabel>
          <FormControl>
            <Input
              id="number"
              name="number"
              value={formData.license.number}
              onChange={handleInputChange}
              className={errors.number ? "border-red-500" : ""}
              placeholder="Enter license number"
            />
          </FormControl>
          {errors.number && <FormMessage>{errors.number}</FormMessage>}
        </FormItem>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormItem className="space-y-2">
          <FormLabel htmlFor="state">State</FormLabel>
          <Select
            value={formData.license.state}
            onValueChange={(value) => handleSelectChange("state", value)}
          >
            <FormControl>
              <SelectTrigger className={errors.state ? "border-red-500" : ""}>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {states.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.state && <FormMessage>{errors.state}</FormMessage>}
        </FormItem>

        <FormItem className="space-y-2">
          <FormLabel htmlFor="expirationDate">Expiration Date</FormLabel>
          <FormControl>
            <Input
              id="expirationDate"
              name="expirationDate"
              type="date"
              value={formData.license.expirationDate}
              onChange={handleInputChange}
              className={errors.expirationDate ? "border-red-500" : ""}
            />
          </FormControl>
          {errors.expirationDate && (
            <FormMessage>{errors.expirationDate}</FormMessage>
          )}
        </FormItem>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="hidden" // Hidden button to trigger form submission
        />
      </div>
    </form>
  );
}
