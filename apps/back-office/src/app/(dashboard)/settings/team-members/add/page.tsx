"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { Button } from "@mcw/ui";
import PersonalInfoForm, {
  PersonalInfoFormRef,
} from "../components/AddTeamMember/PersonalInfoForm";
import ClinicalInfoForm, {
  ClinicalInfoFormRef,
} from "../components/AddTeamMember/ClinicalInfoForm";
import LicenseInfoForm, {
  LicenseInfoFormRef,
} from "../components/AddTeamMember/LicenseInfoForm";
import RoleInfoForm, {
  RoleInfoFormRef,
} from "../components/AddTeamMember/RoleInfoForm";
import CompletionStep from "../components/AddTeamMember/CompletionStep";
import TeamMemberSummary from "./components/TeamMemberSummary";
import { TeamMember } from "../hooks/useRolePermissions";

export default function AddTeamMemberPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [teamMemberData, setTeamMemberData] = useState<Partial<TeamMember>>({
    firstName: "",
    lastName: "",
    email: "",
    roles: [], // Initialize with empty array
    clinicianLevel: "Basic", // Initialize with default clinician level
    services: [],
    license: {
      type: "",
      number: "",
      expirationDate: "",
      state: "",
    },
  });

  // Track whether roles have been submitted (step 2 completed)
  const [rolesSubmitted, setRolesSubmitted] = useState(false);

  // Refs to trigger form submissions
  const personalFormRef = useRef<PersonalInfoFormRef>(null);
  const roleFormRef = useRef<RoleInfoFormRef>(null);
  const clinicalFormRef = useRef<ClinicalInfoFormRef>(null);
  const licenseFormRef = useRef<LicenseInfoFormRef>(null);

  // Helper function to check if Clinician role is selected
  const isClinicianSelected = () => {
    return teamMemberData.roles?.includes("Clinician") || false;
  };

  // All possible steps
  const allSteps = [
    {
      label: "Personal Info",
      description: "Basic information",
      key: "personal",
    },
    {
      label: "Role & Permissions",
      description: "Access control",
      key: "roles",
    },
    {
      label: "Clinical Info",
      description: "Specialty details",
      key: "clinical",
    },
    { label: "License", description: "Licensing information", key: "license" },
    {
      label: "Confirmation",
      description: "Review and save",
      key: "confirmation",
    },
  ];

  // Get visible steps based on selected roles - only after roles are submitted
  const visibleSteps = useMemo(() => {
    console.log("Calculating visible steps, roles:", teamMemberData.roles);
    console.log("Roles submitted:", rolesSubmitted);
    console.log("Is clinician selected:", isClinicianSelected());

    // If roles haven't been submitted yet, show all steps (don't skip anything)
    if (!rolesSubmitted) {
      console.log("Roles not submitted yet, showing all steps");
      return allSteps;
    }

    // After roles are submitted, determine which steps to show
    if (isClinicianSelected()) {
      console.log("Showing all steps (clinician selected)");
      return allSteps; // Show all steps if Clinician is selected
    } else {
      console.log("Skipping clinical steps (no clinician role)");
      // Skip Clinical Info and License steps if Clinician is not selected
      return allSteps.filter(
        (step) => step.key !== "clinical" && step.key !== "license",
      );
    }
  }, [teamMemberData.roles, rolesSubmitted]); // Recalculate when roles change OR when roles are submitted

  // Handle step adjustment when roles change
  useEffect(() => {
    // If we're currently on a step that's no longer visible, move to the confirmation step
    if (activeStep >= visibleSteps.length) {
      setActiveStep(visibleSteps.length - 1); // Move to confirmation step
    }
  }, [visibleSteps, activeStep]);

  // Map visible step index to actual step index
  const getActualStepIndex = (visibleIndex: number) => {
    const visibleStep = visibleSteps[visibleIndex];
    return allSteps.findIndex((step) => step.key === visibleStep.key);
  };

  // // Ensure roles is always an array
  // const roles = useMemo(() => {
  //   return Array.isArray(teamMemberData.roles)
  //     ? teamMemberData.roles
  //     : teamMemberData.role
  //       ? [teamMemberData.role]
  //       : [];
  // }, [teamMemberData.roles, teamMemberData.role]);

  const handleBack = () => {
    setActiveStep((prevStep) => Math.max(0, prevStep - 1));
  };

  const handleNext = () => {
    setActiveStep((prevStep) =>
      Math.min(visibleSteps.length - 1, prevStep + 1),
    );
  };

  const handleStepSubmit = (data: Partial<TeamMember>) => {
    setTeamMemberData((prev) => ({ ...prev, ...data }));

    // If this is the role submission (step 1), check if we need to skip steps
    if (activeStep === 1) {
      setRolesSubmitted(true);

      // Check if clinician role is selected in the submitted data
      const hasClinicianRole = data.roles?.includes("Clinician") || false;

      if (hasClinicianRole) {
        // Clinician selected - proceed to next step (Clinical Info)
        handleNext();
      } else {
        // No clinician role - skip to confirmation step
        // Find the confirmation step index in the filtered steps
        const confirmationStepIndex =
          allSteps.filter(
            (step) => step.key !== "clinical" && step.key !== "license",
          ).length - 1;
        setActiveStep(confirmationStepIndex);
      }
    } else {
      // For all other steps, just proceed normally
      handleNext();
    }
  };

  // Handle Next button click - trigger form submission based on actual step
  const handleNextClick = () => {
    const actualStepIndex = getActualStepIndex(activeStep);
    switch (actualStepIndex) {
      case 0: // Personal Info
        personalFormRef.current?.submitForm();
        break;
      case 1: // Role & Permissions
        roleFormRef.current?.submitForm();
        break;
      case 2: // Clinical Info
        clinicalFormRef.current?.submitForm();
        break;
      case 3: // License
        licenseFormRef.current?.submitForm();
        break;
      default:
        handleNext();
    }
  };

  // Just move to the final step, no API call
  const handleFinish = () => {
    // Go to completion step
    handleNext();
  };

  const renderStepContent = () => {
    const actualStepIndex = getActualStepIndex(activeStep);
    switch (actualStepIndex) {
      case 0: // Personal Info
        return (
          <PersonalInfoForm
            ref={personalFormRef}
            initialData={teamMemberData}
            onSubmit={handleStepSubmit}
          />
        );
      case 1: // Role & Permissions
        return (
          <RoleInfoForm
            ref={roleFormRef}
            initialData={teamMemberData}
            onSubmit={handleStepSubmit}
          />
        );
      case 2: // Clinical Info
        return (
          <ClinicalInfoForm
            ref={clinicalFormRef}
            initialData={teamMemberData}
            onSubmit={handleStepSubmit}
          />
        );
      case 3: // License
        return (
          <LicenseInfoForm
            ref={licenseFormRef}
            initialData={teamMemberData}
            onSubmit={handleStepSubmit}
          />
        );
      case 4: // Confirmation
        return (
          <CompletionStep
            teamMemberData={teamMemberData}
            onClose={() => (window.location.href = "/settings/team-members")}
          />
        );
      default:
        return null;
    }
  };

  // Calculate if this is the final confirmation step
  const isCompletionStep = activeStep === visibleSteps.length - 1;

  // Determine if this is the last form step (before confirmation)
  const isLastFormStep = activeStep === visibleSteps.length - 2;

  // Determine button text based on active step
  const getButtonText = () => {
    if (isLastFormStep) return "Submit";
    return "Next";
  };

  return (
    <section className="w-full max-w-7xl mx-auto pt-2 pb-8 px-2 md:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Add Team Member
        </h1>
        <p className="text-gray-500 text-base mt-1">
          Add a new member to your team
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            {/* Form Content */}
            <div className="p-6">
              {/* Add a title for the current step */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {visibleSteps[activeStep].label}
                </h2>
                <p className="text-sm text-gray-500">
                  {visibleSteps[activeStep].description}
                </p>
              </div>

              {renderStepContent()}
            </div>

            {/* Footer */}
            {!isCompletionStep && (
              <div className="px-6 py-4 border-t flex justify-between">
                <Button
                  variant="outline"
                  onClick={
                    activeStep === 0
                      ? () => (window.location.href = "/settings/team-members")
                      : handleBack
                  }
                >
                  {activeStep === 0 ? "Cancel" : "Back"}
                </Button>
                <Button
                  className="bg-[#2D8467] text-white hover:bg-[#256b53]"
                  onClick={isLastFormStep ? handleFinish : handleNextClick}
                >
                  {getButtonText()}
                </Button>
              </div>
            )}
          </div>
        </div>
        <TeamMemberSummary
          teamMemberData={teamMemberData}
          isHidden={isCompletionStep}
        />
      </div>
    </section>
  );
}
