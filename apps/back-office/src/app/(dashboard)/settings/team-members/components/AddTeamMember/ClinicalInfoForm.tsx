"use client";

import { Input, FormControl, FormItem, FormLabel, FormMessage } from "@mcw/ui";
import { useForm } from "@tanstack/react-form";
import type { TeamMemberFormData } from "@/types/entities";
import { validators } from "../shared/validators";
import { StateSelector } from "../shared/StateSelector";

interface ClinicalInfoFormProps {
  initialData: Partial<TeamMemberFormData>;
  onSubmit: (data: Partial<TeamMemberFormData>) => void;
}

export default function ClinicalInfoForm({
  initialData,
  onSubmit,
}: ClinicalInfoFormProps) {
  const form = useForm({
    defaultValues: {
      specialty: initialData.specialty || "",
      npiNumber: initialData.npiNumber || "",
      license: {
        state: initialData.license?.state || "",
        type: initialData.license?.type || "",
        number: initialData.license?.number || "",
        expirationDate: initialData.license?.expirationDate || "",
      },
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
          Clinical Information
        </h3>
        <p className="text-sm text-gray-500">
          Enter the team member's clinical details
        </p>
      </div>

      <form.Field
        name="specialty"
        validators={{
          onBlur: ({ value }) => {
            if (!value) return "Specialty is required";
            return undefined;
          },
        }}
      >
        {(field) => (
          <FormItem className="space-y-2">
            <FormLabel htmlFor={field.name}>Specialty</FormLabel>
            <FormControl>
              <Input
                className={
                  field.state.meta.errors.length ? "border-red-500" : ""
                }
                id={field.name}
                name={field.name}
                placeholder="e.g., Behavioral health therapy"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </FormControl>
            {field.state.meta.errors.length > 0 && (
              <FormMessage>{field.state.meta.errors[0]}</FormMessage>
            )}
          </FormItem>
        )}
      </form.Field>

      <form.Field
        name="npiNumber"
        validators={{
          onBlur: ({ value }) => {
            if (value) {
              return validators.npi(value);
            }
            return undefined;
          },
        }}
      >
        {(field) => (
          <FormItem className="space-y-2">
            <FormLabel htmlFor={field.name}>NPI Number</FormLabel>
            <FormControl>
              <Input
                className={
                  field.state.meta.errors.length ? "border-red-500" : ""
                }
                id={field.name}
                name={field.name}
                placeholder="Enter 10-digit NPI number"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </FormControl>
            {field.state.meta.errors.length > 0 && (
              <FormMessage>{field.state.meta.errors[0]}</FormMessage>
            )}
            <p className="text-xs text-gray-500">
              National Provider Identifier - 10 digit unique identification
              number
            </p>
          </FormItem>
        )}
      </form.Field>

      <form.Field
        name="license.state"
        validators={{
          onBlur: ({ value }) => {
            if (!value) return "State is required";
            return undefined;
          },
        }}
      >
        {(field) => (
          <StateSelector
            label="State"
            value={field.state.value}
            onChange={field.handleChange}
            errors={field.state.meta.errors.map(String)}
            placeholder="Select state"
          />
        )}
      </form.Field>

      <div className="flex justify-end">
        <button
          className="hidden" // Hidden button to trigger form submission
          type="submit"
        />
      </div>
    </form>
  );
}
