"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
} from "@mcw/ui";
import { Check } from "lucide-react";
import PersonalInfoForm from "./AddTeamMember/PersonalInfoForm";
import ClinicalInfoForm from "./AddTeamMember/ClinicalInfoForm";
import LicenseInfoForm from "./AddTeamMember/LicenseInfoForm";
import ServicesForm from "./AddTeamMember/ServicesForm";
import RoleInfoForm from "./AddTeamMember/RoleInfoForm";
import CompletionStep from "./AddTeamMember/CompletionStep";
import { TeamMember } from "../hooks/useRolePermissions";

interface AddTeamMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddTeamMemberDialog({
  isOpen,
  onClose,
}: AddTeamMemberDialogProps) {
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
          <CompletionStep teamMemberData={teamMemberData} onClose={onClose} />
        );
      default:
        return null;
    }
  };

  const isLastStep = activeStep === steps.length - 2;
  const isCompletionStep = activeStep === steps.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>Add Team Member</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 border-b">
          {/* Custom stepper UI */}
          <div className="flex items-center justify-between">
            {steps.slice(0, -1).map((step, index) => (
              <div key={index} className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    activeStep > index
                      ? "bg-[#2D8467] text-white"
                      : activeStep === index
                        ? "border-2 border-[#2D8467] text-[#2D8467]"
                        : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {activeStep > index ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <p
                  className={`text-xs mt-1 ${activeStep === index ? "font-medium text-[#2D8467]" : "text-gray-500"}`}
                >
                  {step.label}
                </p>
              </div>
            ))}
          </div>

          <div className="relative mt-2">
            <div className="absolute top-0 h-0.5 w-full bg-gray-200">
              <div
                className="absolute top-0 h-0.5 bg-[#2D8467] transition-all"
                style={{
                  width: `${(100 * activeStep) / (steps.length - 2)}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-6 max-h-[50vh] overflow-y-auto">
          {renderStepContent()}
        </div>

        {!isCompletionStep && (
          <div className="px-6 py-4 border-t flex justify-between">
            <Button
              variant="outline"
              onClick={activeStep === 0 ? onClose : handleBack}
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
      </DialogContent>
    </Dialog>
  );
}
