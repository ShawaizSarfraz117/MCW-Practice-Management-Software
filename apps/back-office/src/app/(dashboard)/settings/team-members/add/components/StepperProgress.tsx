import { Check } from "lucide-react";

interface StepProps {
  number: number;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
}

interface StepperProgressProps {
  activeStep: number;
}

export default function StepperProgress({ activeStep }: StepperProgressProps) {
  // Create a flat list of steps
  const steps: StepProps[] = [
    {
      number: 1,
      label: "Personal Info",
      isActive: activeStep === 0,
      isCompleted: activeStep > 0,
    },
    {
      number: 2,
      label: "Clinical Info",
      isActive: activeStep === 1,
      isCompleted: activeStep > 1,
    },
    {
      number: 3,
      label: "License",
      isActive: activeStep === 2,
      isCompleted: activeStep > 2,
    },
    {
      number: 4,
      label: "Services",
      isActive: activeStep === 3,
      isCompleted: activeStep > 3,
    },
    {
      number: 5,
      label: "Role & Permissions",
      isActive: activeStep === 4,
      isCompleted: activeStep > 4,
    },
  ];

  return (
    <div className="p-4 border-b">
      <div className="flex justify-between items-center gap-3">
        {steps.map((step, index) => (
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
              {index < steps.length - 1 && (
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
