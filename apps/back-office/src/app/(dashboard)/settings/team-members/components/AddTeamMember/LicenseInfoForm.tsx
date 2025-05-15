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
import statesUS from "@/(dashboard)/clients/services/statesUS.json";

// Define just what we need from TeamMember for this component
interface License {
  type: string;
  number: string;
  expirationDate: string;
  state: string;
}

interface TeamMemberLicense {
  license?: License;
}

interface LicenseInfoFormProps {
  initialData: Partial<TeamMemberLicense>;
  onSubmit: (data: Partial<TeamMemberLicense>) => void;
}

export default function LicenseInfoForm({
  initialData,
  onSubmit,
}: LicenseInfoFormProps) {
  const licenseTypes = [
    "LMFT",
    "LCSW",
    "LPC",
    "LMHC",
    "LP",
    "MD",
    "DO",
    "PMHNP",
    "PA",
  ];

  // Common validator for required fields
  const requiredValidator =
    (fieldName: string) =>
    ({ value }: { value: string }) =>
      !value ? `${fieldName} is required` : undefined;

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
      onSubmit({ license: value.license });
    },
  });

  // Reusable error display logic
  const renderError = (errors: unknown[]) =>
    errors.length > 0 && <FormMessage>{String(errors[0])}</FormMessage>;

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
            onBlur: requiredValidator("License type"),
          }}
        >
          {(field) => (
            <FormItem className="space-y-2">
              <FormLabel htmlFor={field.name}>License Type</FormLabel>
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
              {renderError(field.state.meta.errors)}
            </FormItem>
          )}
        </form.Field>

        <form.Field
          name="license.number"
          validators={{
            onBlur: requiredValidator("License number"),
          }}
        >
          {(field) => (
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
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </FormControl>
              {renderError(field.state.meta.errors)}
            </FormItem>
          )}
        </form.Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <form.Field
          name="license.state"
          validators={{
            onBlur: requiredValidator("State"),
          }}
        >
          {(field) => (
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
              {renderError(field.state.meta.errors)}
            </FormItem>
          )}
        </form.Field>

        <form.Field
          name="license.expirationDate"
          validators={{
            onBlur: requiredValidator("Expiration date"),
          }}
        >
          {(field) => (
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
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </FormControl>
              {renderError(field.state.meta.errors)}
            </FormItem>
          )}
        </form.Field>
      </div>

      <div className="flex justify-end">
        <button className="hidden" type="submit" />
      </div>
    </form>
  );
}
