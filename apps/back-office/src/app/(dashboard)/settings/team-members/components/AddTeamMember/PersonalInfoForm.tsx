"use client";

import { Input, FormControl, FormItem, FormLabel, FormMessage } from "@mcw/ui";
import { useForm } from "@tanstack/react-form";
import { TeamMember } from "../../hooks/useRolePermissions";

interface PersonalInfoFormProps {
  initialData: Partial<TeamMember>;
  onSubmit: (data: Partial<TeamMember>) => void;
}

export default function PersonalInfoForm({
  initialData,
  onSubmit,
}: PersonalInfoFormProps) {
  const form = useForm({
    defaultValues: {
      email: initialData.email || "",
      firstName: initialData.firstName || "",
      lastName: initialData.lastName || "",
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
          Personal Information
        </h3>
        <p className="text-sm text-gray-500">
          Enter the team member's basic information
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <form.Field
          children={(field) => (
            <FormItem className="space-y-2">
              <FormLabel htmlFor={field.name}>First Name</FormLabel>
              <FormControl>
                <Input
                  className={
                    field.state.meta.errors.length ? "border-red-500" : ""
                  }
                  id={field.name}
                  name={field.name}
                  placeholder="Enter first name"
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
          name="firstName"
          validators={{
            onBlur: ({ value }) => {
              if (!value) return "First name is required";
              return undefined;
            },
          }}
        />

        <form.Field
          children={(field) => (
            <FormItem className="space-y-2">
              <FormLabel htmlFor={field.name}>Last Name</FormLabel>
              <FormControl>
                <Input
                  className={
                    field.state.meta.errors.length ? "border-red-500" : ""
                  }
                  id={field.name}
                  name={field.name}
                  placeholder="Enter last name"
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
          name="lastName"
          validators={{
            onBlur: ({ value }) => {
              if (!value) return "Last name is required";
              return undefined;
            },
          }}
        />
      </div>

      <form.Field
        children={(field) => (
          <FormItem className="space-y-2">
            <FormLabel htmlFor={field.name}>Email</FormLabel>
            <FormControl>
              <Input
                className={
                  field.state.meta.errors.length ? "border-red-500" : ""
                }
                id={field.name}
                name={field.name}
                placeholder="Enter email address"
                type="email"
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
        name="email"
        validators={{
          onBlur: ({ value }) => {
            if (!value) return "Email is required";
            if (!/\S+@\S+\.\S+/.test(value))
              return "Please enter a valid email address";
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
