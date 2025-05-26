"use client";

import { useState, useRef } from "react";
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

  // Refs to trigger form submissions
  const personalFormRef = useRef<PersonalInfoFormRef>(null);
  const roleFormRef = useRef<RoleInfoFormRef>(null);
  const clinicalFormRef = useRef<ClinicalInfoFormRef>(null);
  const licenseFormRef = useRef<LicenseInfoFormRef>(null);

  // // Ensure roles is always an array
  // const roles = useMemo(() => {
  //   return Array.isArray(teamMemberData.roles)
  //     ? teamMemberData.roles
  //     : teamMemberData.role
  //       ? [teamMemberData.role]
  //       : [];
  // }, [teamMemberData.roles, teamMemberData.role]);

  // Fixed steps in sequence
  const steps = [
    { label: "Personal Info", description: "Basic information" },
    { label: "Role & Permissions", description: "Access control" },
    { label: "Clinical Info", description: "Specialty details" },
    { label: "License", description: "Licensing information" },
    { label: "Confirmation", description: "Review and save" },
  ];

  const handleBack = () => {
    setActiveStep((prevStep) => Math.max(0, prevStep - 1));
  };

  const handleNext = () => {
    setActiveStep((prevStep) => Math.min(steps.length - 1, prevStep + 1));
  };

  const handleStepSubmit = (data: Partial<TeamMember>) => {
    setTeamMemberData((prev) => ({ ...prev, ...data }));
    handleNext();
  };

  // Handle Next button click - trigger form submission
  const handleNextClick = () => {
    switch (activeStep) {
      case 0:
        personalFormRef.current?.submitForm();
        break;
      case 1:
        roleFormRef.current?.submitForm();
        break;
      case 2:
        clinicalFormRef.current?.submitForm();
        break;
      case 3:
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
    switch (activeStep) {
      case 0:
        return (
          <PersonalInfoForm
            ref={personalFormRef}
            initialData={teamMemberData}
            onSubmit={handleStepSubmit}
          />
        );
      case 1:
        return (
          <RoleInfoForm
            ref={roleFormRef}
            initialData={teamMemberData}
            onSubmit={handleStepSubmit}
          />
        );
      case 2:
        return (
          <ClinicalInfoForm
            ref={clinicalFormRef}
            initialData={teamMemberData}
            onSubmit={handleStepSubmit}
          />
        );
      case 3:
        return (
          <LicenseInfoForm
            ref={licenseFormRef}
            initialData={teamMemberData}
            onSubmit={handleStepSubmit}
          />
        );
      case 4:
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
  const isCompletionStep = activeStep === steps.length - 1;
  const isLastFormStep = activeStep === 3; // License step is the last form step

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
                  {steps[activeStep].label}
                </h2>
                <p className="text-sm text-gray-500">
                  {steps[activeStep].description}
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
