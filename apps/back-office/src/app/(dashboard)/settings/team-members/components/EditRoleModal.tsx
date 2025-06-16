"use client";

import {
  Dialog,
  DialogContent,
  Card,
  RadioGroup,
  RadioGroupItem,
  Label,
  Checkbox,
  Button,
} from "@mcw/ui";
import { TeamMember, ClinicianLevel } from "../hooks/useRolePermissions";
import ProfileSvg from "@/assets/images/member.png";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@mcw/ui";
import { showErrorToast } from "@mcw/utils";

interface EditRoleModalProps {
  open: boolean;
  onClose: () => void;
  member: TeamMember;
}

interface RoleOption {
  id: string;
  title: string;
  description: string;
  price?: string;
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

// Clinician level options
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

// Map database role names to UI role names
const mapDatabaseRoleToUI = (dbRole: string): string => {
  const roleMap: Record<string, string> = {
    "ADMIN.PRACTICE-MANAGER": "Practice Administrator",
    "ADMIN.PRACTICE-BILLER": "Practice Biller",
    "CLINICIAN.BASIC": "Clinician",
    "CLINICIAN.BILLING": "Clinician",
    "CLINICIAN.FULL-CLIENT-LIST": "Clinician",
    "CLINICIAN.ENTIRE-PRACTICE": "Clinician",
    "CLINICIAN.SUPERVISOR": "Supervisor",
  };
  return roleMap[dbRole] || dbRole;
};

// Map UI role names to database role names
const mapUIRoleToDatabase = (
  uiRole: string,
  clinicianLevel?: ClinicianLevel,
): string => {
  if (uiRole === "Clinician" && clinicianLevel) {
    const levelMap: Record<ClinicianLevel, string> = {
      Basic: "CLINICIAN.BASIC",
      Billing: "CLINICIAN.BILLING",
      "Full client list": "CLINICIAN.FULL-CLIENT-LIST",
      "Entire practice": "CLINICIAN.ENTIRE-PRACTICE",
    };
    return levelMap[clinicianLevel] || "CLINICIAN.BASIC";
  }

  const roleMap: Record<string, string> = {
    "Practice Administrator": "ADMIN.PRACTICE-MANAGER",
    "Practice Biller": "ADMIN.PRACTICE-BILLER",
    Supervisor: "CLINICIAN.SUPERVISOR",
  };

  return roleMap[uiRole] || uiRole;
};

// Extract clinician level from database role
const extractClinicianLevel = (dbRole: string): ClinicianLevel => {
  const levelMap: Record<string, ClinicianLevel> = {
    "CLINICIAN.BASIC": "Basic",
    "CLINICIAN.BILLING": "Billing",
    "CLINICIAN.FULL-CLIENT-LIST": "Full client list",
    "CLINICIAN.ENTIRE-PRACTICE": "Entire practice",
  };
  return levelMap[dbRole] || "Basic";
};

export default function EditRoleModal({
  open,
  onClose,
  member,
}: EditRoleModalProps) {
  const queryClient = useQueryClient();

  // Initialize selected roles from member data
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedClinicianLevel, setSelectedClinicianLevel] =
    useState<ClinicianLevel>("Basic");

  // Initialize state when modal opens
  useEffect(() => {
    if (open && member.roles) {
      // Map database roles to UI roles
      const uiRoles = [
        ...new Set(member.roles.map((role) => mapDatabaseRoleToUI(role))),
      ];
      setSelectedRoles(uiRoles);

      // Extract clinician level if Clinician role is present
      const clinicianRole = member.roles.find(
        (role) =>
          role.startsWith("CLINICIAN.") && role !== "CLINICIAN.SUPERVISOR",
      );
      if (clinicianRole) {
        setSelectedClinicianLevel(extractClinicianLevel(clinicianRole));
      }
    }
  }, [open, member.roles]);

  // Update team member mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { roles: string[] }) => {
      const response = await fetch(`/api/team-members`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: member.id,
          roles: data.roles,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update team member");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Team member roles updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      queryClient.invalidateQueries({
        queryKey: ["clinician-details", member.id],
      });
      onClose();
    },
    onError: (error: unknown) => {
      showErrorToast(toast, error);
    },
  });

  const handleRoleToggle = (roleId: string) => {
    const isSelected = selectedRoles.includes(roleId);

    if (isSelected) {
      // Remove role
      setSelectedRoles(selectedRoles.filter((r) => r !== roleId));
    } else {
      // Add role
      setSelectedRoles([...selectedRoles, roleId]);
    }
  };

  const handleClinicianLevelChange = (level: ClinicianLevel) => {
    setSelectedClinicianLevel(level);
  };

  const handleSave = () => {
    // Convert UI roles to database roles
    const dbRoles: string[] = [];

    selectedRoles.forEach((uiRole) => {
      if (uiRole === "Clinician") {
        dbRoles.push(mapUIRoleToDatabase(uiRole, selectedClinicianLevel));
      } else {
        dbRoles.push(mapUIRoleToDatabase(uiRole));
      }
    });

    updateMutation.mutate({ roles: dbRoles });
  };

  // Format role for display
  const formatRoleForDisplay = (role: string) => {
    const roleDisplayMap: Record<string, string> = {
      ADMIN: "Admin",
      "ADMIN.PRACTICE-MANAGER": "Admin - Practice Manager",
      "ADMIN.PRACTICE-BILLER": "Admin - Practice Biller",
      "CLINICIAN.BASIC": "Clinician - Basic Access",
      "CLINICIAN.BILLING": "Clinician - Billing Access",
      "CLINICIAN.FULL-CLIENT-LIST": "Clinician - Full Client List",
      "CLINICIAN.ENTIRE-PRACTICE": "Clinician - Entire Practice",
      "CLINICIAN.SUPERVISOR": "Clinician - Supervisor",
    };
    return roleDisplayMap[role] || role;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[1440px] h-[700px] p-8 md:p-10 overflow-y-auto bg-white rounded-xl flex flex-row gap-6">
        <div className="flex-1 max-w-[1000px]">
          <h2 className="text-[22px] font-semibold text-[#181C1F] mb-2">
            Edit team member
          </h2>
          <div className="text-[16px] text-[#181C1F] mb-6">
            Update{" "}
            <span className="font-medium">
              {member.firstName} {member.lastName}
            </span>
            's roles
          </div>
          <div className="text-[16px] text-[#181C1F] mb-6">
            <a
              className="text-[15px] text-[#2563eb] hover:underline font-medium"
              href="#"
            >
              Need help? Learn about SimplePractice roles
            </a>
          </div>

          {/* Role categories */}
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
                                className="mt-1"
                                onCheckedChange={() =>
                                  handleRoleToggle(role.id)
                                }
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
                                  className="space-y-3"
                                  value={selectedClinicianLevel}
                                  onValueChange={handleClinicianLevelChange}
                                >
                                  {role.subOptions?.map((subOption) => (
                                    <div
                                      key={subOption.id}
                                      className="flex items-start space-x-3"
                                    >
                                      <RadioGroupItem
                                        className="mt-1"
                                        id={`level-${subOption.id}`}
                                        value={subOption.id}
                                      />
                                      <div className="flex flex-col">
                                        <Label
                                          className="font-medium text-sm cursor-pointer"
                                          htmlFor={`level-${subOption.id}`}
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

          {/* Validation message */}
          {selectedRoles.length === 0 && (
            <p className="text-red-500 text-sm mt-4">
              At least one role selection is required
            </p>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-3 mt-8">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="bg-[#2D8467] hover:bg-[#256b53] text-white"
              disabled={selectedRoles.length === 0 || updateMutation.isPending}
              onClick={handleSave}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Right sidebar showing current roles */}
        <div className="w-[450px] bg-[#FAFAFB] rounded-xl p-6 self-start">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              <Image alt="Profile" height={16} src={ProfileSvg} width={14} />
            </div>
            <div>
              <div className="font-semibold text-[17px] text-[#181C1F] leading-tight">
                {member.firstName} {member.lastName}
              </div>
              <div className="text-[15px] text-[#6B7280] leading-tight">
                {member.email}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Current Roles
              </h4>
              {member.roles && member.roles.length > 0 ? (
                <div className="space-y-2">
                  {member.roles.map((role) => (
                    <div
                      key={role}
                      className="flex justify-between items-center py-2 px-3 bg-white rounded-lg"
                    >
                      <span className="text-[14px] text-[#181C1F]">
                        {formatRoleForDisplay(role)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No roles assigned</p>
              )}
            </div>

            {selectedRoles.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Selected Roles
                </h4>
                <div className="space-y-2">
                  {selectedRoles.map((roleId) => {
                    const role = roleCategories
                      .flatMap((c) => c.roles)
                      .find((r) => r.id === roleId);

                    if (!role) return null;

                    return (
                      <div
                        key={roleId}
                        className="py-2 px-3 bg-blue-50 rounded-lg"
                      >
                        <div className="text-[14px] font-medium text-[#181C1F]">
                          {role.title}
                        </div>
                        {roleId === "Clinician" && (
                          <div className="text-[12px] text-gray-600 mt-1">
                            Level: {selectedClinicianLevel}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
