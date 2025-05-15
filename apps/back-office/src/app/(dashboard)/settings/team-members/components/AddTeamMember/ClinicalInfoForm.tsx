"use client";

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
import { useForm } from "@tanstack/react-form";
import { TeamMember } from "../../hooks/useRolePermissions";
import statesUS from "../../../../clients/services/statesUS.json";

interface ClinicalInfoFormProps {
  initialData: Partial<TeamMember>;
  onSubmit: (data: Partial<TeamMember>) => void;
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
        children={(field) => (
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
        name="specialty"
        validators={{
          onBlur: ({ value }) => {
            if (!value) return "Specialty is required";
            return undefined;
          },
        }}
      />

      <form.Field
        children={(field) => (
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
        name="npiNumber"
        validators={{
          onBlur: ({ value }) => {
            if (value && !/^\d{10}$/.test(value)) {
              return "NPI Number must be 10 digits";
            }
            return undefined;
          },
        }}
      />

      <form.Field
        children={(field) => (
          <FormItem className="space-y-2">
            <FormLabel htmlFor={field.name}>State</FormLabel>
            <Select
              value={field.state.value}
              onOpenChange={() => field.handleBlur()}
              onValueChange={field.handleChange}
            >
              <FormControl>
                <SelectTrigger
                  className={
                    field.state.meta.errors.length ? "border-red-500" : ""
                  }
                  id={field.name}
                >
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {statesUS.map((state) => (
                  <SelectItem
                    key={state.abbreviation}
                    value={state.abbreviation}
                  >
                    {state.name} ({state.abbreviation})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.state.meta.errors.length > 0 && (
              <FormMessage>{field.state.meta.errors[0]}</FormMessage>
            )}
          </FormItem>
        )}
        name="license.state"
        validators={{
          onBlur: ({ value }) => {
            if (!value) return "State is required";
            return undefined;
          },
        }}
      />

      <div className="flex justify-end">
        <button
          className="hidden" // Hidden button to trigger form submission
          type="submit"
        />
      </div>
    </form>
  );
}
