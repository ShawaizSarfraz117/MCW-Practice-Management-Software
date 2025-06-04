"use client";

import { Card, RadioGroup, RadioGroupItem, Label, Checkbox } from "@mcw/ui";
import { forwardRef, useImperativeHandle, useState } from "react";
import {
  TeamMember,
  RoleType,
  ClinicianLevel,
} from "../../hooks/useRolePermissions";

interface RoleInfoFormProps {
  initialData: Partial<TeamMember>;
  onSubmit: (data: Partial<TeamMember>) => void;
  onChange?: (data: Partial<TeamMember>) => void;
}

export interface RoleInfoFormRef {
  submitForm: () => void;
}

interface RoleOption {
  id: RoleType;
  title: string;
  description: string;
  price?: string;
  isSelected?: boolean;
  subOptions?: ClinicianLevelOption[];
}

interface ClinicianLevelOption {
  id: ClinicianLevel;
  title: string;
  description: string;
}

interface RoleCategory {
  title: string;
  roles: RoleOption[];
}

// Move these outside the component to prevent recreation on every render
const clinicianLevelOptions: ClinicianLevelOption[] = [
  {
    id: "Basic",
    title: "Basic",
    description: "Can schedule and add documentation for their clients",
  },
  {
    id: "Billing",
    title: "Billing",
    description: "Can bill, schedule, and add documentation for their clients",
  },
  {
    id: "Full client list",
    title: "Full client list",
    description:
      "Can bill, schedule, and add documentation for their clients. Can see profiles and appointments for all clients.",
  },
  {
    id: "Entire practice",
    title: "Entire practice",
    description:
      "Can bill, schedule, and add documentation for all clients in the practice. Can see most reports and practice settings.",
  },
];

// Role categories with pricing and options
const roleCategories: RoleCategory[] = [
  {
    title: "Clinical roles",
    roles: [
      {
        id: "Clinician",
        title: "Clinician",
        description: "For team members who treat clients",
        price: "$74/month",
        subOptions: clinicianLevelOptions,
      },
      {
        id: "Supervisor",
        title: "Supervisor",
        description: "For team members who supervise a pre-licensed clinician",
        price: "Free",
      },
    ],
  },
  {
    title: "Administrative roles",
    roles: [
      {
        id: "Practice Administrator",
        title: "Practice manager",
        description:
          "For team members who make administrative decisions for the practice",
        price: "Free",
      },
      {
        id: "Practice Biller",
        title: "Practice biller",
        description:
          "For team members who handle client payments and insurance",
        price: "Free",
      },
    ],
  },
];

const RoleInfoForm = forwardRef<RoleInfoFormRef, RoleInfoFormProps>(
  ({ initialData, onSubmit, onChange: _onChange }, ref) => {
    // Use local state to prevent infinite re-renders from form field updates
    const [selectedRoles, setSelectedRoles] = useState<string[]>(
      initialData.roles || [],
    );
    const [selectedClinicianLevel, setSelectedClinicianLevel] =
      useState<ClinicianLevel>(initialData.clinicianLevel || "Basic");

    useImperativeHandle(ref, () => ({
      submitForm: () => {
        // Calculate role categories for selected roles
        const selectedRoleCategories = selectedRoles.map((roleId: string) => {
          // Find which category this role belongs to
          for (const categoryGroup of roleCategories) {
            const roleInCategory = categoryGroup.roles.find(
              (role) => role.id === roleId,
            );
            if (roleInCategory) {
              return {
                roleId,
                category: categoryGroup.title,
                roleTitle: roleInCategory.title,
              };
            }
          }
          return { roleId, category: "Unknown", roleTitle: roleId };
        });

        const submitData = {
          roles: selectedRoles,
          clinicianLevel: selectedClinicianLevel,
          roleCategories: selectedRoleCategories,
        };
        onSubmit(submitData);
      },
    }));

    const handleRoleToggle = (roleId: RoleType) => {
      const isSelected = selectedRoles.includes(roleId);

      if (isSelected) {
        // Remove role
        const updatedRoles = selectedRoles.filter((r) => r !== roleId);
        setSelectedRoles(updatedRoles);
      } else {
        // Add role
        const updatedRoles = [...selectedRoles, roleId];
        setSelectedRoles(updatedRoles);
      }
    };

    const handleClinicianLevelChange = (level: ClinicianLevel) => {
      setSelectedClinicianLevel(level);
    };

    return (
      <div className="w-full max-w-none">
        <div className="space-y-6">
          <div className="space-y-6">
            {roleCategories.map((category) => (
              <div key={category.title} className="space-y-4">
                <h4 className="text-base font-medium text-gray-600 mb-4">
                  {category.title}
                </h4>

                <div className="space-y-4">
                  {category.roles.map((role) => {
                    const isSelected = selectedRoles.includes(role.id);

                    return (
                      <div key={role.id} className="space-y-3">
                        <Card
                          className={`p-4 cursor-pointer border transition-colors ${
                            isSelected
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleRoleToggle(role.id);
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() =>
                                  handleRoleToggle(role.id)
                                }
                                className="mt-1"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="flex flex-col flex-1">
                                <div className="flex items-center justify-between">
                                  <Label className="font-medium text-base cursor-pointer">
                                    {role.title}
                                  </Label>
                                  {role.price && (
                                    <span
                                      className={`text-sm font-medium ${
                                        role.price === "Free"
                                          ? "text-gray-600"
                                          : "text-gray-800"
                                      }`}
                                    >
                                      {role.price}
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-500 text-sm mt-1">
                                  {role.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        </Card>

                        {/* Clinician level sub-options */}
                        {role.id === "Clinician" &&
                          isSelected &&
                          role.subOptions && (
                            <div className="ml-8 mt-4">
                              <div className="space-y-3">
                                <RadioGroup
                                  value={selectedClinicianLevel}
                                  onValueChange={handleClinicianLevelChange}
                                  className="space-y-3"
                                >
                                  {role.subOptions?.map((subOption) => (
                                    <div
                                      key={subOption.id}
                                      className="flex items-start space-x-3"
                                    >
                                      <RadioGroupItem
                                        value={subOption.id}
                                        id={`level-${subOption.id}`}
                                        className="mt-1"
                                      />
                                      <div className="flex flex-col">
                                        <Label
                                          htmlFor={`level-${subOption.id}`}
                                          className="font-medium text-sm cursor-pointer"
                                        >
                                          {subOption.title}
                                        </Label>
                                        <p className="text-gray-500 text-sm">
                                          {subOption.description}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </RadioGroup>
                              </div>
                            </div>
                          )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Simple validation message */}
          {selectedRoles.length === 0 && (
            <p className="text-red-500 text-sm">
              At least one role selection is required
            </p>
          )}
        </div>
      </div>
    );
  },
);

RoleInfoForm.displayName = "RoleInfoForm";

export default RoleInfoForm;
