"use client";

import { createContext, useContext, ReactNode } from "react";
import { FormContextType, FormInterface } from "../Types";

// Create a more permissive type for the form context
const FormContext = createContext<FormContextType | undefined>(undefined);

export function useFormContext() {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error("useFormContext must be used within a FormProvider");
  }
  return context;
}

// Use a more specific type for the form prop
interface FormProviderProps {
  children: ReactNode;
  form: FormInterface;
  validationErrors: Record<string, boolean>;
  setValidationErrors: (errors: Record<string, boolean>) => void;
  setGeneralError: (error: string | null) => void;
  duration: string;
  forceUpdate: () => void;
  effectiveClinicianId?: string | null;
  isAdmin?: boolean;
  isClinician?: boolean;
  shouldFetchData?: boolean;
}

export function FormProvider({
  children,
  form,
  validationErrors,
  setValidationErrors,
  setGeneralError,
  duration,
  forceUpdate,
  effectiveClinicianId,
  isAdmin,
  isClinician,
  shouldFetchData,
}: FormProviderProps) {
  return (
    <FormContext.Provider
      value={{
        form,
        validationErrors,
        setValidationErrors,
        setGeneralError,
        duration,
        forceUpdate,
        effectiveClinicianId,
        isAdmin,
        isClinician,
        shouldFetchData,
      }}
    >
      {children}
    </FormContext.Provider>
  );
}
