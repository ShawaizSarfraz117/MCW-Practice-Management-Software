"use client";

import { Button } from "@mcw/ui";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { parseRole } from "@mcw/types";
import {
  TeamMember,
  useRolePermissions,
  RoleCategory,
} from "@/(dashboard)/settings/team-members/hooks/useRolePermissions";
import { isClinicianWithSubroles } from "@/(dashboard)/settings/team-members/utils/roleUtils";
import { useCreateTeamMember } from "@/(dashboard)/settings/team-members/services/member.service";
import { useEffect, useState, useRef, useCallback } from "react";

interface CompletionStepProps {
  teamMemberData: Partial<TeamMember> & { role?: string };
  onClose: () => void;
  onGoBack?: () => void;
}

export default function CompletionStep({
  teamMemberData,
  onClose,
  onGoBack,
}: CompletionStepProps) {
  const [submissionState, setSubmissionState] = useState<
    "submitting" | "success" | "error"
  >("submitting");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const hasSubmittedRef = useRef(false);

  const createTeamMemberMutation = useCreateTeamMember({
    onSuccess: (data) => {
      console.log("Component onSuccess called with:", data);
      setSubmissionState("success");
    },
    onError: (error) => {
      console.log("Component onError called with:", error);

      // Extract meaningful error message
      let errorMsg = "An unexpected error occurred";

      // Check if error is directly an object with error property (from FETCH utility)
      if (error && typeof error === "object" && "error" in error) {
        const directError = error as {
          error?: string;
          details?: unknown;
          missingRoles?: string[];
        };
        if (directError.error) {
          errorMsg = directError.error;
          // Add details if available
          if (directError.details) {
            errorMsg += `: ${JSON.stringify(directError.details)}`;
          }
          if (directError.missingRoles) {
            errorMsg += `. Missing roles: ${directError.missingRoles.join(", ")}`;
          }
        }
      }
      // Check for nested response structure
      else if (error && typeof error === "object" && "response" in error) {
        const responseError = error as {
          response?: {
            data?: {
              error?: string;
              details?: unknown;
              missingRoles?: string[];
            };
          };
        };
        if (responseError.response?.data?.error) {
          errorMsg = responseError.response.data.error;
          // Add details if available
          if (responseError.response.data.details) {
            errorMsg += `: ${JSON.stringify(responseError.response.data.details)}`;
          }
          if (responseError.response.data.missingRoles) {
            errorMsg += `. Missing roles: ${responseError.response.data.missingRoles.join(", ")}`;
          }
        }
      }
      // Check for simple message property
      else if (error && typeof error === "object" && "message" in error) {
        const messageError = error as { message: string };
        errorMsg = messageError.message;
      }

      setErrorMessage(errorMsg);
      setSubmissionState("error");
      // Reset hasSubmitted on error so user can retry
      hasSubmittedRef.current = false;
    },
  });

  const fullName =
    `${teamMemberData.firstName || ""} ${teamMemberData.lastName || ""}`.trim();

  const { getClinicianLevelDescription } = useRolePermissions();

  // Get roles from either roles array or single role for backward compatibility
  const roles = Array.isArray(teamMemberData.roles)
    ? teamMemberData.roles
    : teamMemberData.role
      ? [teamMemberData.role]
      : [];

  // Format roles for display in text
  const formatRoleForDisplay = (role: string) => {
    const { category, subcategory } = parseRole(role);
    const formattedSubcategory = subcategory
      .replace(/-/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
    return `${category} - ${formattedSubcategory}`;
  };

  const rolesDisplay =
    roles.length > 1
      ? roles.map(formatRoleForDisplay).join(", ")
      : roles.length === 1
        ? formatRoleForDisplay(roles[0])
        : "team member";

  // Check if specific Clinician role is present (not Supervisor)
  const hasClinicianWithLevels = roles.some((role) =>
    isClinicianWithSubroles(role),
  );

  // Function to submit team member data
  const submitTeamMember = useCallback(() => {
    console.log("submitTeamMember called");
    console.log("Team member data before submission:", teamMemberData);

    // Map role categories to specific role formats
    const mapCategoriesToRoles = (roleCategories: RoleCategory[]) => {
      const mappedRoles: string[] = [];

      roleCategories.forEach((roleCategory) => {
        const roleId = roleCategory.roleId;
        const category = roleCategory.category.toLowerCase();

        // Handle Clinical roles
        if (category.includes("clinical")) {
          if (roleId === "Clinician") {
            // For Clinician role, append the clinician level
            const level = teamMemberData.clinicianLevel || "Basic";
            // Map clinician levels to the expected format
            const levelMap: Record<string, string> = {
              Basic: "CLINICIAN.BASIC",
              Billing: "CLINICIAN.BILLING",
              "Full client list": "CLINICIAN.FULL-CLIENT-LIST",
              "Entire practice": "CLINICIAN.ENTIRE-PRACTICE",
            };
            const mappedRole = levelMap[level] || "CLINICIAN.BASIC";
            mappedRoles.push(mappedRole);
          } else if (roleId === "Supervisor") {
            mappedRoles.push("CLINICIAN.SUPERVISOR");
          }
        }

        // Handle Administrative roles
        else if (category.includes("administrative")) {
          if (roleId === "Practice Administrator") {
            mappedRoles.push("ADMIN.PRACTICE-MANAGER");
          } else if (roleId === "Practice Biller") {
            mappedRoles.push("ADMIN.PRACTICE-BILLER");
          }
        }
      });

      return mappedRoles;
    };

    // Map categories to roles
    const rolesToSend = teamMemberData.roleCategories
      ? mapCategoriesToRoles(teamMemberData.roleCategories)
      : ["ADMIN-PRACTICE-MANAGER"]; // Default fallback

    // Prepare the data for the API
    const apiData = {
      email: teamMemberData.email!,
      firstName: teamMemberData.firstName!,
      lastName: teamMemberData.lastName!,
      roles: rolesToSend, // Send the formatted roles (CLINICIAN-BASIC, etc.)
      roleCategories: teamMemberData.roleCategories, // Send the full category data for reference
      clinicianLevel: teamMemberData.clinicianLevel, // Include clinician level
      ...(teamMemberData.specialty && {
        specialty: teamMemberData.specialty,
      }),
      ...(teamMemberData.npiNumber && {
        npiNumber: teamMemberData.npiNumber,
      }),
      // Include license data only if all required fields are present
      ...(teamMemberData.license &&
        teamMemberData.license.type &&
        teamMemberData.license.number &&
        teamMemberData.license.expirationDate &&
        teamMemberData.license.state && {
          license: {
            type: teamMemberData.license.type,
            number: teamMemberData.license.number,
            expirationDate: teamMemberData.license.expirationDate,
            state: teamMemberData.license.state,
          },
        }),
      ...(teamMemberData.services && { services: teamMemberData.services }),
    };

    // Mark as submitted to prevent duplicate calls
    hasSubmittedRef.current = true;

    console.log("License data in teamMemberData:", teamMemberData.license);
    console.log("Calling mutation with data:", apiData);
    console.log("License included in apiData:", apiData.license);
    createTeamMemberMutation.mutate({ body: apiData });
  }, [teamMemberData, createTeamMemberMutation]);

  // Submit the team member data when component mounts (only once)
  useEffect(() => {
    if (!hasSubmittedRef.current) {
      submitTeamMember();
    }
  }, [submitTeamMember]); // Include submitTeamMember in dependencies

  // Show loading state
  if (submissionState === "submitting") {
    return (
      <div className="flex flex-col items-center py-6 text-center space-y-4">
        <div className="rounded-full bg-blue-50 p-3">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-900">
            Creating Team Member...
          </h3>
          <p className="text-gray-600 max-w-md">
            Please wait while we set up {fullName}'s account and permissions.
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (submissionState === "error") {
    return (
      <div className="flex flex-col items-center py-6 text-center space-y-4">
        <div className="rounded-full bg-red-50 p-3">
          <AlertCircle className="h-12 w-12 text-red-600" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-900">
            Failed to Create Team Member
          </h3>
          <p className="text-gray-600 max-w-md">{errorMessage}</p>
        </div>
        <div className="mt-6 flex space-x-3 w-full justify-center">
          {onGoBack && (
            <Button variant="outline" onClick={onGoBack}>
              Edit Information
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={() => {
              setSubmissionState("submitting");
              hasSubmittedRef.current = false;
              createTeamMemberMutation.reset(); // Reset mutation state
              submitTeamMember();
            }}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Show success state
  return (
    <div className="flex flex-col items-center py-6 text-center space-y-4">
      <div className="rounded-full bg-green-50 p-3">
        <CheckCircle2 className="h-12 w-12 text-[#2D8467]" />
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-gray-900">
          Team Member Created Successfully
        </h3>
        <p className="text-gray-600 max-w-md">
          {fullName} has been added to your team with{" "}
          {roles.length > 1 ? "the following roles:" : "the role of"}{" "}
          {rolesDisplay}.
        </p>
      </div>

      <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 w-full mt-6 max-w-md">
        <div className="flex flex-col space-y-3 text-left">
          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-medium">{fullName}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium">{teamMemberData.email}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Roles</p>
            <div className="mt-1 space-y-2">
              {roles.map((role, index) => {
                const { category, subcategory } = parseRole(role);
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {category}
                      </span>
                      <span className="font-medium">
                        {subcategory
                          .replace(/-/g, " ")
                          .toLowerCase()
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Show clinician level only if the Clinician role is selected (not Supervisor) */}
          {hasClinicianWithLevels && teamMemberData.clinicianLevel && (
            <div>
              <p className="text-sm text-gray-500">Clinician Level</p>
              <p className="font-medium">{teamMemberData.clinicianLevel}</p>
              <p className="text-xs text-gray-500 mt-1">
                {getClinicianLevelDescription(teamMemberData.clinicianLevel)}
              </p>
            </div>
          )}

          {teamMemberData.specialty && (
            <div>
              <p className="text-sm text-gray-500">Specialty</p>
              <p className="font-medium">{teamMemberData.specialty}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex space-x-3 w-full justify-center">
        <Button
          className="bg-[#2D8467] text-white hover:bg-[#256b53]"
          onClick={onClose}
        >
          Done
        </Button>
        <Button variant="outline">View Team Member</Button>
      </div>
    </div>
  );
}
