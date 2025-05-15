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

interface LicenseInfoFormProps {
  initialData: Partial<TeamMember>;
  onSubmit: (data: Partial<TeamMember>) => void;
}

export default function LicenseInfoForm({
  initialData,
  onSubmit,
}: LicenseInfoFormProps) {
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

  const form = useForm({
    defaultValues: {
      license: {
        type: initialData.license?.type || "",
        number: initialData.license?.number || "",
        expirationDate: initialData.license?.expirationDate || "",
        state: initialData.license?.state || "",
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
          License Information
        </h3>
        <p className="text-sm text-gray-500">
          Enter the team member's professional license details
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <form.Field
          name="license.type"
          validators={{
            onBlur: ({ value }) => {
              if (!value) return "License type is required";
              return undefined;
            },
          }}
          children={(field) => (
            <FormItem className="space-y-2">
              <FormLabel htmlFor={field.name}>License Type</FormLabel>
              <Select
                value={field.state.value}
                onValueChange={field.handleChange}
                onOpenChange={() => field.handleBlur()}
              >
                <FormControl>
                  <SelectTrigger
                    id={field.name}
                    className={
                      field.state.meta.errors.length ? "border-red-500" : ""
                    }
                  >
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
              {field.state.meta.errors.length > 0 && (
                <FormMessage>{field.state.meta.errors[0]}</FormMessage>
              )}
            </FormItem>
          )}
        />

        <form.Field
          name="license.number"
          validators={{
            onBlur: ({ value }) => {
              if (!value) return "License number is required";
              return undefined;
            },
          }}
          children={(field) => (
            <FormItem className="space-y-2">
              <FormLabel htmlFor={field.name}>License Number</FormLabel>
              <FormControl>
                <Input
                  className={
                    field.state.meta.errors.length ? "border-red-500" : ""
                  }
                  id={field.name}
                  name={field.name}
                  placeholder="Enter license number"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
              </FormControl>
              {field.state.meta.errors.length > 0 && (
                <FormMessage>{field.state.meta.errors[0]}</FormMessage>
              )}
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <form.Field
          name="license.state"
          validators={{
            onBlur: ({ value }) => {
              if (!value) return "State is required";
              return undefined;
            },
          }}
          children={(field) => (
            <FormItem className="space-y-2">
              <FormLabel htmlFor={field.name}>State</FormLabel>
              <Select
                value={field.state.value}
                onValueChange={field.handleChange}
                onOpenChange={() => field.handleBlur()}
              >
                <FormControl>
                  <SelectTrigger
                    id={field.name}
                    className={
                      field.state.meta.errors.length ? "border-red-500" : ""
                    }
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
        />

        <form.Field
          name="license.expirationDate"
          validators={{
            onBlur: ({ value }) => {
              if (!value) return "Expiration date is required";
              return undefined;
            },
          }}
          children={(field) => (
            <FormItem className="space-y-2">
              <FormLabel htmlFor={field.name}>Expiration Date</FormLabel>
              <FormControl>
                <Input
                  className={
                    field.state.meta.errors.length ? "border-red-500" : ""
                  }
                  id={field.name}
                  name={field.name}
                  type="date"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
              </FormControl>
              {field.state.meta.errors.length > 0 && (
                <FormMessage>{field.state.meta.errors[0]}</FormMessage>
              )}
            </FormItem>
          )}
        />
      </div>

      <div className="flex justify-end">
        <button className="hidden" type="submit" />
      </div>
    </form>
  );
}
