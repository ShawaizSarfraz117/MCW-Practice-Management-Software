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
import { useStepNavigation } from "../hooks/useStepNavigation";

export default function AddTeamMemberPage() {
  const [teamMemberData, setTeamMemberData] = useState<Partial<TeamMember>>({
    firstName: "",
    lastName: "",
    email: "",
    roles: [],
    clinicianLevel: "Basic",
    services: [],
    license: {
      type: "",
      number: "",
      expirationDate: "",
      state: "",
    },
  });

  const {
    activeStep,
    visibleSteps,
    getActualStepIndex,
    handleBack,
    handleNext,
    handleStepSubmit,
    isCompletionStep,
    isLastFormStep,
  } = useStepNavigation(teamMemberData);

  // Refs to trigger form submissions
  const personalFormRef = useRef<PersonalInfoFormRef>(null);
  const roleFormRef = useRef<RoleInfoFormRef>(null);
  const clinicalFormRef = useRef<ClinicalInfoFormRef>(null);
  const licenseFormRef = useRef<LicenseInfoFormRef>(null);

  const updateTeamMemberData = (data: Partial<TeamMember>) => {
    console.log("Updating team member data with:", data);
    setTeamMemberData((prev) => {
      const updated = { ...prev, ...data };
      console.log("Updated team member data:", updated);
      return updated;
    });
  };

  const onStepSubmit = (data: Partial<TeamMember>) => {
    handleStepSubmit(data, updateTeamMemberData);
  };

  const handleNextClick = () => {
    const actualStepIndex = getActualStepIndex(activeStep);
    switch (actualStepIndex) {
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

  const handleFinish = () => {
    // Submit the current form before moving to completion
    const actualStepIndex = getActualStepIndex(activeStep);
    if (actualStepIndex === 3) {
      // We're on the license step, submit it first
      licenseFormRef.current?.submitForm();
    } else {
      // For other steps, just move to next
      handleNext();
    }
  };

  const renderStepContent = () => {
    const actualStepIndex = getActualStepIndex(activeStep);
    switch (actualStepIndex) {
      case 0:
        return (
          <PersonalInfoForm
            ref={personalFormRef}
            initialData={teamMemberData}
            onSubmit={onStepSubmit}
          />
        );
      case 1:
        return (
          <RoleInfoForm
            ref={roleFormRef}
            initialData={teamMemberData}
            onSubmit={onStepSubmit}
          />
        );
      case 2:
        return (
          <ClinicalInfoForm
            ref={clinicalFormRef}
            initialData={teamMemberData}
            onSubmit={onStepSubmit}
          />
        );
      case 3:
        return (
          <LicenseInfoForm
            ref={licenseFormRef}
            initialData={teamMemberData}
            onSubmit={onStepSubmit}
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

  const getButtonText = () => {
    if (isLastFormStep) return "Submit";
    return "Next";
  };

  return (
    <section className="w-full max-w-7xl mx-auto pt-2 pb-8 px-2 md:px-8">
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
            <div className="p-6">
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
          isHidden={isCompletionStep}
          teamMemberData={teamMemberData}
        />
      </div>
    </section>
  );
}
