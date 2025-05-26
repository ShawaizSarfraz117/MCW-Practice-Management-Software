"use client";

import { useState } from "react";
import { Button } from "@mcw/ui";
import PersonalInfoForm from "../components/AddTeamMember/PersonalInfoForm";
import ClinicalInfoForm from "../components/AddTeamMember/ClinicalInfoForm";
import LicenseInfoForm from "../components/AddTeamMember/LicenseInfoForm";
import RoleInfoForm from "../components/AddTeamMember/RoleInfoForm";
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

  const handleFormChange = (data: Partial<TeamMember>) => {
    setTeamMemberData((prev) => ({ ...prev, ...data }));
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
            initialData={teamMemberData}
            onSubmit={handleStepSubmit}
            onChange={handleFormChange}
          />
        );
      case 1:
        return (
          <RoleInfoForm
            initialData={teamMemberData}
            onSubmit={handleStepSubmit}
            onChange={handleFormChange}
          />
        );
      case 2:
        return (
          <ClinicalInfoForm
            initialData={teamMemberData}
            onSubmit={handleStepSubmit}
            onChange={handleFormChange}
          />
        );
      case 3:
        return (
          <LicenseInfoForm
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
  const isLastFormStep = 4;

  // Determine button text based on active step
  const getButtonText = () => {
    console.log(activeStep + 1);
    console.log(steps.length - 1);
    if (activeStep + 1 === steps.length - 1) return "Submit";
    if (activeStep === 1) return "Next"; // Specifically for Role step
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
                  onClick={isLastFormStep ? handleFinish : handleNext}
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
