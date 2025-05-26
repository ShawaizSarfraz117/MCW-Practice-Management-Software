"use client";

import React, { createContext, useContext, useState } from "react";
import type { AppointmentData } from "./components/AppointmentStep";

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
      }
    >,
  ) => void;
  setCurrentStep: (step: number) => void;
  setAppointmentStep: (step: AppointmentStep) => void;
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
