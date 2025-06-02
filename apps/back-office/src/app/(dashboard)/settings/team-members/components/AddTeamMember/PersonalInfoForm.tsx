"use client";

import { Input, FormControl, FormItem, FormLabel } from "@mcw/ui";
import { useForm } from "@tanstack/react-form";
import type { TeamMemberFormData } from "@/types/entities";
import {
  FormWrapper,
  FormHeader,
  FormField,
  getFieldStyles,
} from "../shared/FormWrapper";
import { validators } from "../shared/validators";

interface PersonalInfoFormProps {
  initialData: Partial<TeamMemberFormData>;
  onSubmit: (data: Partial<TeamMemberFormData>) => void;
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
    <FormWrapper onSubmit={() => form.handleSubmit()}>
      <FormHeader
        title="Personal Information"
        description="Enter the team member's basic information"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <form.Field
          name="firstName"
          validators={{
            onBlur: validators.required("First name is required"),
          }}
        >
          {(field) => (
            <FormField errors={field.state.meta.errors.map(String)}>
              <FormItem className="space-y-2">
                <FormLabel htmlFor={field.name}>First Name</FormLabel>
                <FormControl>
                  <Input
                    className={getFieldStyles(
                      field.state.meta.errors.length > 0,
                    )}
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Enter first name"
                    value={field.state.value}
                  />
                </FormControl>
              </FormItem>
            </FormField>
          )}
        </form.Field>

        <form.Field
          name="lastName"
          validators={{
            onBlur: validators.required("Last name is required"),
          }}
        >
          {(field) => (
            <FormField errors={field.state.meta.errors.map(String)}>
              <FormItem className="space-y-2">
                <FormLabel htmlFor={field.name}>Last Name</FormLabel>
                <FormControl>
                  <Input
                    className={getFieldStyles(
                      field.state.meta.errors.length > 0,
                    )}
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Enter last name"
                    value={field.state.value}
                  />
                </FormControl>
              </FormItem>
            </FormField>
          )}
        </form.Field>
      </div>

      <form.Field
        name="email"
        validators={{
          onBlur: (field) =>
            validators.required("Email is required")(field.value) ||
            validators.email(field.value),
        }}
      >
        {(field) => (
          <FormField errors={field.state.meta.errors.map(String)}>
            <FormItem className="space-y-2">
              <FormLabel htmlFor={field.name}>Email</FormLabel>
              <FormControl>
                <Input
                  className={getFieldStyles(field.state.meta.errors.length > 0)}
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Enter email address"
                  type="email"
                  value={field.state.value}
                />
              </FormControl>
            </FormItem>
          </FormField>
        )}
      </form.Field>
    </FormWrapper>
  );
}
