"use client";

import { useState, useEffect } from "react";
import { Button } from "@mcw/ui";
import PersonalInfoForm from "../components/AddTeamMember/PersonalInfoForm";
import ClinicalInfoForm from "../components/AddTeamMember/ClinicalInfoForm";
import LicenseInfoForm from "../components/AddTeamMember/LicenseInfoForm";
import ServicesForm from "../components/AddTeamMember/ServicesForm";
import RoleInfoForm from "../components/AddTeamMember/RoleInfoForm";
import CompletionStep from "../components/AddTeamMember/CompletionStep";
import StepperProgress from "./components/StepperProgress";
import TeamMemberSummary from "./components/TeamMemberSummary";

// Define the TeamMember type inline to avoid import issues
interface TeamMember {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  specialty?: string;
  npiNumber?: string;
  license?: {
    type: string;
    number: string;
    expirationDate: string;
    state: string;
  };
  services?: string[];
}

export default function AddTeamMemberPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [teamMemberData, setTeamMemberData] = useState<Partial<TeamMember>>({
    firstName: "",
    lastName: "",
    email: "",
    role: "Clinician with entire practice access",
    services: [],
    license: {
      type: "",
      number: "",
      expirationDate: "",
      state: "",
    },
  });

  // This effect runs when form inputs change
  useEffect(() => {
    const handleFormInputChange = (event: Event) => {
      const input = event.target as HTMLInputElement;
      if (input && input.name) {
        // Update teamMemberData in real-time as user types
        setTeamMemberData((prev) => ({
          ...prev,
          [input.name]: input.value,
        }));
      }
    };

    // Add listener to form inputs
    document.addEventListener("input", handleFormInputChange);

    return () => {
      document.removeEventListener("input", handleFormInputChange);
    };
  }, []);

  const steps = [
    { label: "Personal Info", description: "Basic information" },
    { label: "Clinical Info", description: "Specialty details" },
    { label: "License", description: "Licensing information" },
    { label: "Services", description: "Offered services" },
    { label: "Role & Permissions", description: "Access control" },
    { label: "Complete", description: "Review and save" },
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

  const handleSave = async () => {
    try {
      const response = await fetch("/api/clinician", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(teamMemberData),
      });

      if (!response.ok) {
        throw new Error("Failed to create team member");
      }

      // Go to completion step
      handleNext();
    } catch (error) {
      console.error("Error creating team member:", error);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <PersonalInfoForm
            initialData={teamMemberData}
            onSubmit={handleStepSubmit}
          />
        );
      case 1:
        return (
          <ClinicalInfoForm
            initialData={teamMemberData}
            onSubmit={handleStepSubmit}
          />
        );
      case 2:
        return (
          <LicenseInfoForm
            initialData={teamMemberData}
            onSubmit={handleStepSubmit}
          />
        );
      case 3:
        return (
          <ServicesForm
            initialData={teamMemberData}
            onSubmit={handleStepSubmit}
          />
        );
      case 4:
        return (
          <RoleInfoForm
            initialData={teamMemberData}
            onSubmit={handleStepSubmit}
          />
        );
      case 5:
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

  const isLastStep = activeStep === steps.length - 2;
  const isCompletionStep = activeStep === steps.length - 1;

  return (
    <section className="flex flex-col gap-6 w-full max-w-7xl mx-auto pt-2 pb-8 px-2 md:px-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Add Team Member
          </h1>
          <p className="text-gray-500 text-base mt-1">
            Add a new member to your team
          </p>
        </div>
      </div>

      {/* Two-column layout for desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form Content - Takes up 2/3 of space on desktop */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {/* Stepper Progress */}
            <StepperProgress activeStep={activeStep} />

            {/* Form Content */}
            <div className="px-6 py-6">{renderStepContent()}</div>

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
                  onClick={isLastStep ? handleSave : handleNext}
                >
                  {isLastStep ? "Save" : "Next"}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Summary Section */}
        <TeamMemberSummary
          teamMemberData={teamMemberData}
          isHidden={isCompletionStep}
        />
      </div>
    </section>
  );
}
