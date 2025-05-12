"use client";

import { useState } from "react";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
  Checkbox,
  Badge,
} from "@mcw/ui";
import { TeamMember } from "../../hooks/useRolePermissions";

interface ServicesFormProps {
  initialData: Partial<TeamMember>;
  onSubmit: (data: Partial<TeamMember>) => void;
}

export default function ServicesForm({
  initialData,
  onSubmit,
}: ServicesFormProps) {
  const [selectedServices, setSelectedServices] = useState<string[]>(
    initialData.services || [],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sample available services
  const availableServices = [
    "Individual Therapy",
    "Couples Therapy",
    "Family Therapy",
    "Group Therapy",
    "Child & Adolescent Therapy",
    "Cognitive Behavioral Therapy (CBT)",
    "Dialectical Behavior Therapy (DBT)",
    "EMDR Therapy",
    "Psychoanalytic Therapy",
    "Mindfulness-Based Therapy",
    "Trauma-Focused Therapy",
    "Substance Abuse Counseling",
    "Grief Counseling",
    "Career Counseling",
    "Life Coaching",
    "Psychiatric Evaluation",
    "Medication Management",
    "Psychological Testing",
    "Neurofeedback",
  ];

  const handleServiceToggle = (service: string) => {
    setSelectedServices((prev) => {
      const isSelected = prev.includes(service);
      if (isSelected) {
        return prev.filter((s) => s !== service);
      } else {
        return [...prev, service];
      }
    });

    // Clear error when selection is changed
    if (errors.services) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.services;
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (selectedServices.length === 0) {
      newErrors.services = "At least one service must be selected";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit({ services: selectedServices });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1.5">
        <h3 className="text-lg font-semibold text-gray-900">Services</h3>
        <p className="text-sm text-gray-500">
          Select the services offered by this team member
        </p>
      </div>

      <FormItem className="space-y-2">
        <FormLabel className="text-base">Available Services</FormLabel>
        <FormControl>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border rounded-md p-3">
            {availableServices.map((service) => (
              <div key={service} className="flex items-center space-x-2">
                <Checkbox
                  id={`service-${service}`}
                  checked={selectedServices.includes(service)}
                  onCheckedChange={() => handleServiceToggle(service)}
                />
                <label
                  htmlFor={`service-${service}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {service}
                </label>
              </div>
            ))}
          </div>
        </FormControl>
        {errors.services && <FormMessage>{errors.services}</FormMessage>}
      </FormItem>

      {selectedServices.length > 0 && (
        <div className="space-y-2">
          <FormLabel className="text-base">Selected Services</FormLabel>
          <div className="flex flex-wrap gap-2">
            {selectedServices.map((service) => (
              <Badge key={service} variant="outline" className="px-3 py-1">
                {service}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          className="hidden" // Hidden button to trigger form submission
        />
      </div>
    </form>
  );
}
