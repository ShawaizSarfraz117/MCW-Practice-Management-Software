import { FC, memo } from "react";

export interface Step {
  id: number;
  label: string;
  summary?: {
    service?: {
      title: string;
      duration: string;
    };
    office?: {
      name: string;
      phone: string;
      type?: "video" | "in-person";
    };
    dateTime?: string;
    appointmentFor?: string;
    // Reason for visit summary
    reasons?: string[];
    history?: string[];
    additionalInfo?: string;
    // Contact info summary
    name?: string;
    email?: string;
    phone?: string;
    partner?: string;
    client?: string;
    isMinor?: boolean;
  };
  isCompleted?: boolean;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
  onStepClick?: (
    stepId: number,
    section?: "service" | "office" | "datetime",
  ) => void;
}

const StepperComponent: FC<StepperProps> = ({
  steps,
  currentStep,
  className = "",
  onStepClick,
}) => {
  const renderSummary = (step: Step) => {
    if (!step.summary) return null;

    switch (step.id) {
      case 1:
        return (
          <div className="text-green-600 space-y-1">
            {step.summary.service && (
              <button
                onClick={() => onStepClick?.(1, "service")}
                className="block text-left w-full hover:text-green-700"
              >
                <div className="font-medium">{step.summary.service.title}</div>
                <div>{step.summary.service.duration}</div>
              </button>
            )}
            {step.summary.office && (
              <button
                onClick={() =>
                  step.summary?.service && onStepClick?.(1, "office")
                }
                className={`block text-left w-full ${step.summary.service ? "hover:text-green-700" : ""}`}
              >
                <div>{step.summary.office.name}</div>
                <div>{step.summary.office.phone}</div>
              </button>
            )}
            {step.summary.dateTime && (
              <button
                onClick={() =>
                  step.summary?.service &&
                  step.summary?.office &&
                  onStepClick?.(1, "datetime")
                }
                className={`block text-left w-full ${step.summary.service && step.summary.office ? "hover:text-green-700" : ""}`}
              >
                <div>{step.summary.dateTime}</div>
              </button>
            )}
            {step.summary.appointmentFor && (
              <div>{step.summary.appointmentFor}</div>
            )}
          </div>
        );
      case 2:
        return (
          <div className="text-green-600 space-y-1">
            {step.summary.reasons && step.summary.reasons.length > 0 && (
              <div>
                <div className="font-medium">Reasons:</div>
                <ul className="list-disc list-inside">
                  {step.summary.reasons.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
            {step.summary.additionalInfo && (
              <div>
                <div className="font-medium">Additional Info:</div>
                <div>{step.summary.additionalInfo}</div>
              </div>
            )}
          </div>
        );
      case 3:
        return (
          <div className="text-green-600 space-y-1">
            {step.summary.name && (
              <div>
                <div className="font-medium">Contact:</div>
                <div>{step.summary.name}</div>
                <div>{step.summary.email}</div>
                <div>{step.summary.phone}</div>
              </div>
            )}
            {step.summary.partner && (
              <div>
                <div className="font-medium">Partner:</div>
                <div>{step.summary.partner}</div>
              </div>
            )}
            {step.summary.client && (
              <div>
                <div className="font-medium">Client:</div>
                <div>{step.summary.client}</div>
                {step.summary.isMinor !== undefined && (
                  <div>{step.summary.isMinor ? "Minor" : "Adult"}</div>
                )}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`lg:w-64 lg:shrink-0 mb-8 lg:mb-0 ${className}`}>
      <div className="flex lg:flex-col gap-4 lg:gap-8 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col shrink-0">
            <button
              onClick={() => step.isCompleted && onStepClick?.(step.id)}
              className={`flex items-center gap-3 ${step.isCompleted ? "cursor-pointer" : "cursor-default"}`}
            >
              <div
                className={`
                  flex items-center justify-center w-7 h-7 rounded-full 
                  ${
                    currentStep === step.id
                      ? "bg-gray-900 text-white"
                      : step.isCompleted
                        ? "bg-gray-900 text-white"
                        : "bg-gray-200 text-gray-400"
                  }
                  text-sm font-medium
                `}
              >
                {step.id}
              </div>
              <span
                className={`
                  whitespace-nowrap lg:whitespace-normal
                  ${
                    currentStep === step.id || step.isCompleted
                      ? "text-gray-900 font-medium"
                      : "text-gray-400"
                  }
                `}
              >
                {step.label}
              </span>
            </button>

            {/* Show summary if it exists */}
            {step.summary && (
              <div className="ml-10 mt-2 space-y-1 text-sm">
                {renderSummary(step)}
              </div>
            )}

            {index !== steps.length - 1 && (
              <div className="hidden lg:block ml-3.5 w-[1px] h-16 bg-gray-200" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const Stepper = memo(StepperComponent);
