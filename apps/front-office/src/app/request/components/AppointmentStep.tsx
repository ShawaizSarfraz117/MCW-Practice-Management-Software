import { FC, useEffect } from "react";
import { AppointmentOptions } from "@/request/components/AppointmentOptions";
import { AppointmentScheduling } from "@/request/components/AppointmentScheduling";
import { AppointmentFor } from "@/request/components/AppointmentFor";
import { useRequest } from "@/request/context";

interface AppointmentService {
  id: string;
  title: string;
  duration: string;
  price?: string;
}

interface OfficeLocation {
  id: string;
  name: string;
  phone: string;
  type: "video" | "in-person";
  image?: string;
}

interface AppointmentOption {
  id: string;
  title: string;
  duration: string;
  type: string;
  phone?: string;
  image?: string;
}

export interface AppointmentData {
  service?: AppointmentService;
  office?: OfficeLocation;
  dateTime?: string;
  appointmentFor?: "me" | "partner-and-me" | "someone-else";
  reasons?: string[];
  history?: string[];
  additionalInfo?: string;
  contactInfo?: {
    legalFirstName: string;
    legalLastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    paymentMethod: string;
    isMinor: boolean;
    partnerInfo?: {
      legalFirstName: string;
      legalLastName: string;
      email: string;
      phone: string;
      dateOfBirth: string;
    };
    clientInfo?: {
      legalFirstName: string;
      legalLastName: string;
      email: string;
      phone: string;
      dateOfBirth: string;
      isMinor: boolean;
    };
  };
}

type AppointmentStepType =
  | "service"
  | "office"
  | "datetime"
  | "for"
  | "message";

interface AppointmentStepProps {
  onComplete: (data: AppointmentData) => void;
  initialData?: AppointmentData;
  onUpdate?: (data: Partial<AppointmentData>) => void;
  currentPath: string;
  router: {
    push: (path: string) => void;
  };
}

const SERVICES: AppointmentService[] = [
  {
    id: "initial-consultation",
    title: "Initial Consultation - No Charge",
    duration: "15 minutes",
  },
  {
    id: "psychiatric-evaluation",
    title: "Psychiatric Diagnostic Evaluation",
    duration: "50 minutes",
  },
];

export const AppointmentStep: FC<AppointmentStepProps> = ({
  initialData = {},
  onUpdate,
  currentPath,
  router,
}) => {
  const { appointmentStep, setAppointmentStep, setCurrentStep } = useRequest();

  // Update step when URL changes
  useEffect(() => {
    const pathSegments = currentPath.split("/");
    const path = pathSegments[pathSegments.length - 1];

    // Define the step mappings
    const stepMapping: Record<string, AppointmentStepType> = {
      service: "service",
      location: "office",
      date: "datetime",
      "client-type": "for",
      message: "message",
    };

    // Update the appointment step based on the current path
    if (path in stepMapping) {
      setAppointmentStep(stepMapping[path]);

      // Update current step based on the path
      if (path === "message") {
        setCurrentStep(2);
      } else if (path === "client-type") {
        setCurrentStep(1);
      }
    }
  }, [currentPath, setAppointmentStep, setCurrentStep]);

  const handleServiceSelect = (service: AppointmentService) => {
    onUpdate?.({ service });
    router.push("/request/location");
  };

  const handleOfficeSelect = (office: AppointmentOption) => {
    const officeData: OfficeLocation = {
      id: office.id,
      name: office.title,
      phone: office.phone || "",
      type: office.type as "video" | "in-person",
      image: office.image,
    };
    onUpdate?.({ office: officeData });
    router.push("/request/date");
  };

  const handleDateTimeSelect = (dateTime: string) => {
    onUpdate?.({ dateTime });
    router.push("/request/client-type");
  };

  const handleAppointmentForSelect = (
    for_: "me" | "partner-and-me" | "someone-else",
  ) => {
    const data = {
      ...initialData,
      appointmentFor: for_,
    };
    onUpdate?.(data);
    setAppointmentStep("message");
    setCurrentStep(2);
    router.push("/request/message");
  };

  return (
    <div>
      {/* Service Selection */}
      {appointmentStep === "service" && (
        <div className="space-y-4">
          <div className="space-y-4">
            {SERVICES.map((service) => (
              <div
                key={service.id}
                className="w-full p-6 flex items-center justify-between border rounded-lg hover:shadow-md"
              >
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {service.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {service.duration}
                  </p>
                </div>
                <button
                  className="px-6 py-2 bg-green-700 text-white font-medium rounded-lg hover:bg-green-800"
                  onClick={() => handleServiceSelect(service)}
                >
                  SELECT
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Office Selection */}
      {appointmentStep === "office" && (
        <div className="space-y-4">
          <AppointmentOptions onSelect={handleOfficeSelect} />
        </div>
      )}

      {/* Date/Time Selection */}
      {appointmentStep === "datetime" && (
        <div className="space-y-4">
          <AppointmentScheduling onSelect={handleDateTimeSelect} />
        </div>
      )}

      {/* Appointment For Selection */}
      {appointmentStep === "for" && (
        <AppointmentFor onSelect={handleAppointmentForSelect} />
      )}
    </div>
  );
};
