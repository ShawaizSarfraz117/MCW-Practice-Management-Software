"use client";

import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
  Checkbox,
  Badge,
} from "@mcw/ui";
import { useForm } from "@tanstack/react-form";
import { TeamMember } from "@/(dashboard)/settings/team-members/hooks/useRolePermissions";

interface ServicesFormProps {
  initialData: Partial<TeamMember>;
  onSubmit: (data: Partial<TeamMember>) => void;
}

export default function ServicesForm({
  initialData,
  onSubmit,
}: ServicesFormProps) {
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

  const form = useForm({
    defaultValues: {
      services: initialData.services || [],
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
        <h3 className="text-lg font-semibold text-gray-900">Services</h3>
        <p className="text-sm text-gray-500">
          Select the services offered by this team member
        </p>
      </div>

      <form.Field
        name="services"
        validators={{
          onChange: ({ value }) => {
            if (value.length === 0)
              return "At least one service must be selected";
            return undefined;
          },
        }}
      >
        {(field) => (
          <>
            <FormItem className="space-y-2">
              <FormLabel className="text-base">Available Services</FormLabel>
              <FormControl>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border rounded-md p-3">
                  {availableServices.map((service) => (
                    <div key={service} className="flex items-center space-x-2">
                      <Checkbox
                        checked={field.state.value.includes(service)}
                        id={`service-${service}`}
                        onCheckedChange={() => {
                          const currentServices = [...field.state.value];
                          const isSelected = currentServices.includes(service);
                          const newServices = isSelected
                            ? currentServices.filter((s) => s !== service)
                            : [...currentServices, service];
                          field.handleChange(newServices);
                        }}
                      />
                      <label
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        htmlFor={`service-${service}`}
                      >
                        {service}
                      </label>
                    </div>
                  ))}
                </div>
              </FormControl>
              {field.state.meta.errors.length > 0 && (
                <FormMessage>{field.state.meta.errors[0]}</FormMessage>
              )}
            </FormItem>

            {field.state.value.length > 0 && (
              <div className="space-y-2">
                <FormLabel className="text-base">Selected Services</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {field.state.value.map((service) => (
                    <Badge
                      key={service}
                      className="px-3 py-1"
                      variant="outline"
                    >
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </form.Field>

      <div className="flex justify-end">
        <button className="hidden" type="submit" />
      </div>
    </form>
  );
}
