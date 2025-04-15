"use client";

import { createContext, useContext, ReactNode } from "react";
import { FormContextType } from "../Types";

const FormContext = createContext<FormContextType | undefined>(undefined);

export function useFormContext() {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error("useFormContext must be used within a FormProvider");
  }
  return context;
}

interface FormProviderProps extends FormContextType {
  children: ReactNode;
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
