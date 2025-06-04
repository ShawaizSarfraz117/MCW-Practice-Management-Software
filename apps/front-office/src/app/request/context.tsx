"use client";

import React, { createContext, useContext, useState } from "react";
import type { AppointmentData } from "@/request/components/AppointmentStep";

export type AppointmentStep =
  | "service"
  | "office"
  | "datetime"
  | "for"
  | "message";

export interface RequestContextValue {
  appointmentData: AppointmentData & {
    reasons?: string[];
    history?: string[];
    additionalInfo?: string;
    contactInfo?: {
      legalFirstName: string;
      legalLastName: string;
      email: string;
      phone: string;
      partnerInfo?: {
        legalFirstName: string;
        legalLastName: string;
      };
      clientInfo?: {
        legalFirstName: string;
        legalLastName: string;
        isMinor: boolean;
      };
    };
  };
  currentStep: number;
  appointmentStep: AppointmentStep;
  onComplete: (data: AppointmentData) => void;
  onUpdate: (
    data: Partial<
      AppointmentData & {
        reasons?: string[];
        history?: string[];
        additionalInfo?: string;
        contactInfo?: {
          legalFirstName: string;
          legalLastName: string;
          email: string;
          phone: string;
          partnerInfo?: {
            legalFirstName: string;
            legalLastName: string;
          };
          clientInfo?: {
            legalFirstName: string;
            legalLastName: string;
            isMinor: boolean;
          };
        };
      }
    >,
  ) => void;
  setCurrentStep: (step: number) => void;
  setAppointmentStep: (step: AppointmentStep) => void;
  reset: () => void;
}

const RequestContext = createContext<RequestContextValue | null>(null);

export function RequestProvider({ children }: { children: React.ReactNode }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [appointmentStep, setAppointmentStep] =
    useState<AppointmentStep>("service");
  const [appointmentData, setAppointmentData] = useState<
    RequestContextValue["appointmentData"]
  >({});

  const handleAppointmentComplete = (data: AppointmentData) => {
    setAppointmentData(data);
    setCurrentStep(2);
  };

  const handleAppointmentUpdate = (data: Partial<AppointmentData>) => {
    setAppointmentData((prev) => ({ ...prev, ...data }));
  };

  const reset = () => {
    setAppointmentData({});
    setCurrentStep(1);
    setAppointmentStep("service");
  };

  return (
    <RequestContext.Provider
      value={{
        appointmentData,
        currentStep,
        appointmentStep,
        onComplete: handleAppointmentComplete,
        onUpdate: handleAppointmentUpdate,
        setCurrentStep,
        setAppointmentStep,
        reset,
      }}
    >
      {children}
    </RequestContext.Provider>
  );
}

export function useRequest() {
  const context = useContext(RequestContext);
  if (!context) {
    throw new Error("useRequest must be used within a RequestProvider");
  }
  return context;
}
