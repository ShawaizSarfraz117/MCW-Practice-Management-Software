import { useState, useMemo, useEffect } from "react";
import { TeamMember } from "./useRolePermissions";

const allSteps = [
  { label: "Personal Info", description: "Basic information", key: "personal" },
  { label: "Role & Permissions", description: "Access control", key: "roles" },
  { label: "Clinical Info", description: "Specialty details", key: "clinical" },
  { label: "License", description: "Licensing information", key: "license" },
  {
    label: "Confirmation",
    description: "Review and save",
    key: "confirmation",
  },
];

export function useStepNavigation(teamMemberData: Partial<TeamMember>) {
  const [activeStep, setActiveStep] = useState(0);
  const [rolesSubmitted, setRolesSubmitted] = useState(false);

  const isClinicianSelected = () => {
    // Check if any role includes "Clinician" or "Supervisor"
    return (
      teamMemberData.roles?.some(
        (role) => role === "Clinician" || role === "Supervisor",
      ) || false
    );
  };

  const visibleSteps = useMemo(() => {
    if (!rolesSubmitted) return allSteps;

    if (isClinicianSelected()) {
      return allSteps;
    } else {
      return allSteps.filter(
        (step) => step.key !== "clinical" && step.key !== "license",
      );
    }
  }, [teamMemberData.roles, rolesSubmitted]);

  useEffect(() => {
    if (activeStep >= visibleSteps.length) {
      setActiveStep(visibleSteps.length - 1);
    }
  }, [visibleSteps, activeStep]);

  const getActualStepIndex = (visibleIndex: number) => {
    const visibleStep = visibleSteps[visibleIndex];
    return allSteps.findIndex((step) => step.key === visibleStep.key);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => Math.max(0, prevStep - 1));
  };

  const handleNext = () => {
    const nextStep = Math.min(visibleSteps.length - 1, activeStep + 1);

    // Check if we're moving to the completion step
    if (nextStep === visibleSteps.length - 1) {
      console.log("=== MOVING TO COMPLETION STEP ===");
      console.log("Complete Team Member Payload:", teamMemberData);
      console.log("=====================================");
    }

    setActiveStep(nextStep);
  };

  const handleStepSubmit = (
    data: Partial<TeamMember>,
    onDataUpdate: (data: Partial<TeamMember>) => void,
  ) => {
    onDataUpdate(data);

    if (activeStep === 1) {
      setRolesSubmitted(true);
      // Check if any role includes "Clinician" or "Supervisor"
      const hasClinicianRole =
        data.roles?.some(
          (role) => role === "Clinician" || role === "Supervisor",
        ) || false;

      if (hasClinicianRole) {
        handleNext();
      } else {
        const confirmationStepIndex =
          allSteps.filter(
            (step) => step.key !== "clinical" && step.key !== "license",
          ).length - 1;
        setActiveStep(confirmationStepIndex);
      }
    } else {
      handleNext();
    }
  };

  const isCompletionStep = activeStep === visibleSteps.length - 1;
  const isLastFormStep = activeStep === visibleSteps.length - 2;

  return {
    activeStep,
    visibleSteps,
    getActualStepIndex,
    handleBack,
    handleNext,
    handleStepSubmit,
    isCompletionStep,
    isLastFormStep,
  };
}
