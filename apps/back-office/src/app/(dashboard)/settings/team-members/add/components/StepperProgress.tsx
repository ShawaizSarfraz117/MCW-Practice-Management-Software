import { Check } from "lucide-react";

interface Step {
  label: string;
  description: string;
}

interface StepProps {
  number: number;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
}

interface StepperProgressProps {
  activeStep: number;
  steps?: Step[];
}

export default function StepperProgress({
  activeStep,
  steps,
}: StepperProgressProps) {
  // Default steps if none provided
  const defaultSteps = [
    { label: "Personal Info", description: "Basic information" },
    { label: "Role & Permissions", description: "Access control" },
    { label: "Clinical Info", description: "Specialty details" },
    { label: "License", description: "Licensing information" },
    { label: "Confirmation", description: "Review and save" },
  ];

  // Use provided steps or default
  const stepsToUse = steps || defaultSteps;

  // Create a flat list of steps
  const progressSteps: StepProps[] = stepsToUse.map((step, index) => ({
    number: index + 1,
    label: step.label,
    isActive: activeStep === index,
    isCompleted: activeStep > index,
  }));

  // Filter out the "Complete" step for the progress bar display
  const displaySteps = progressSteps.filter(
    (step) => step.label !== "Complete",
  );

  return (
    <div className="p-4 border-b">
      <div className="flex justify-between items-center gap-3">
        {displaySteps.map((step, index) => (
          <div key={index} className="flex items-center flex-1">
            {/* Step Circle */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step.isCompleted
                  ? "bg-[#2D8467] text-white"
                  : step.isActive
                    ? "border-2 border-[#2D8467] text-[#2D8467]"
                    : "bg-gray-100 text-gray-500"
              }`}
            >
              {step.isCompleted ? (
                <Check className="h-4 w-4" />
              ) : (
                <span className="text-sm font-medium">{step.number}</span>
              )}
            </div>

            {/* Step Label */}
            <div className="ml-2 flex-1">
              <span
                className={`text-sm ${
                  step.isActive ? "text-[#2D8467] font-medium" : "text-gray-500"
                }`}
              >
                {step.label}
              </span>

              {/* Progress Line (if not the last step) */}
              {index < displaySteps.length - 1 && (
                <div className="mt-3 h-0.5 bg-gray-200 relative">
                  {step.isCompleted && (
                    <div className="absolute top-0 left-0 h-0.5 bg-[#2D8467] w-full" />
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
