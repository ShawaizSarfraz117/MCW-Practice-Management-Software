"use client";

import { Input, FormControl, FormItem, FormLabel, FormMessage } from "@mcw/ui";
import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";
import { TeamMember } from "../../hooks/useRolePermissions";

interface PersonalInfoFormProps {
  initialData: Partial<TeamMember>;
  onSubmit: (data: Partial<TeamMember>) => void;
  onChange?: (data: Partial<TeamMember>) => void;
}

export default function PersonalInfoForm({
  initialData,
  onSubmit,
  onChange,
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

  // Watch for form changes and notify parent
  useEffect(() => {
    const subscription = form.store.subscribe(() => {
      const currentValues = {
        firstName: form.getFieldValue("firstName"),
        lastName: form.getFieldValue("lastName"),
        email: form.getFieldValue("email"),
      };
      onChange?.(currentValues);
    });

    return () => subscription();
  }, [form.store, onChange]);

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <form.Field
          name="firstName"
          validators={{
            onBlur: ({ value }) => {
              if (!value) return "First name is required";
              return undefined;
            },
          }}
        >
          {(field) => (
            <FormItem className="space-y-2">
              <FormLabel htmlFor={field.name}>First Name</FormLabel>
              <FormControl>
                <Input
                  className={
                    field.state.meta.errors.length ? "border-red-500" : ""
                  }
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Enter first name"
                  value={field.state.value}
                />
              </FormControl>
              {field.state.meta.errors.length > 0 && (
                <FormMessage>{field.state.meta.errors[0]}</FormMessage>
              )}
            </FormItem>
          )}
        </form.Field>

        <form.Field
          name="lastName"
          validators={{
            onBlur: ({ value }) => {
              if (!value) return "Last name is required";
              return undefined;
            },
          }}
        >
          {(field) => (
            <FormItem className="space-y-2">
              <FormLabel htmlFor={field.name}>Last Name</FormLabel>
              <FormControl>
                <Input
                  className={
                    field.state.meta.errors.length ? "border-red-500" : ""
                  }
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Enter last name"
                  value={field.state.value}
                />
              </FormControl>
              {field.state.meta.errors.length > 0 && (
                <FormMessage>{field.state.meta.errors[0]}</FormMessage>
              )}
            </FormItem>
          )}
        </form.Field>
      </div>

      <form.Field
        name="email"
        validators={{
          onBlur: ({ value }) => {
            if (!value) return "Email is required";
            if (!/\S+@\S+\.\S+/.test(value))
              return "Please enter a valid email address";
            return undefined;
          },
        }}
      >
        {(field) => (
          <FormItem className="space-y-2">
            <FormLabel htmlFor={field.name}>Email</FormLabel>
            <FormControl>
              <Input
                className={
                  field.state.meta.errors.length ? "border-red-500" : ""
                }
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Enter email address"
                type="email"
                value={field.state.value}
              />
            </FormControl>
            {field.state.meta.errors.length > 0 && (
              <FormMessage>{field.state.meta.errors[0]}</FormMessage>
            )}
          </FormItem>
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
