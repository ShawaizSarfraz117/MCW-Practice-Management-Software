"use client";

import { createContext, useContext, ReactNode } from "react";
import {
  AvailabilityFormContextType,
  AvailabilityFormInterface,
  AvailabilityFormValues,
} from "../types";
import { useForm } from "@tanstack/react-form";

const AvailabilityFormContext = createContext<
  AvailabilityFormContextType | undefined
>(undefined);

export function useAvailabilityFormContext() {
  const context = useContext(AvailabilityFormContext);
  if (!context) {
    throw new Error(
      "useAvailabilityFormContext must be used within an AvailabilityFormProvider",
    );
  }
  return context;
}

interface AvailabilityFormProviderProps {
  children: ReactNode;
  form?: AvailabilityFormInterface;
  validationErrors: Record<string, boolean>;
  setValidationErrors: (errors: Record<string, boolean>) => void;
  setGeneralError: (error: string | null) => void;
  duration: string;
  forceUpdate: () => void;
  effectiveClinicianId?: string | null;
  isAdmin?: boolean;
  isClinician?: boolean;
  shouldFetchData?: boolean;
  initialValues?: Partial<AvailabilityFormValues>;
}

export function AvailabilityFormProvider({
  children,
  form: externalForm,
  validationErrors,
  setValidationErrors,
  setGeneralError,
  duration,
  forceUpdate,
  effectiveClinicianId,
  isAdmin,
  isClinician,
  shouldFetchData,
  initialValues,
}: AvailabilityFormProviderProps) {
  // Create the TanStack form
  // @ts-expect-error TanStack form has complex generic types that we're simplifying here
  const tanstackForm = useForm<Partial<AvailabilityFormValues>>({
    defaultValues: initialValues || {},
    onSubmit: async () => {
      // This will be handled by the parent component
    },
  });

  // Create an adapter that implements the AvailabilityFormInterface expected by consumers
  const formAdapter: AvailabilityFormInterface = externalForm || {
    getFieldValue: <T = unknown,>(
      field: string | keyof AvailabilityFormValues,
    ): T => {
      const fieldPath = field.toString();
      const value = fieldPath.split(".").reduce<unknown>(
        (obj, key) => {
          if (obj && typeof obj === "object") {
            return (obj as Record<string, unknown>)[key];
          }
          return undefined;
        },
        tanstackForm.state.values as Record<string, unknown>,
      );
      return value as T;
    },
    setFieldValue: (
      field: string | keyof AvailabilityFormValues,
      value: unknown,
    ) => {
      const fieldPath = field.toString();
      if (fieldPath.includes(".")) {
        const [parent, ...parts] = fieldPath.split(".");
        const currentParentValue =
          tanstackForm.getFieldValue(parent as keyof AvailabilityFormValues) ||
          {};
        const updatedValue = { ...currentParentValue } as Record<
          string,
          unknown
        >;
        let current = updatedValue;
        const pathParts = parts.slice(0, -1);
        const finalKey = parts[parts.length - 1];
        for (const part of pathParts) {
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part] as Record<string, unknown>;
        }
        current[finalKey] = value;
        // @ts-expect-error Complex nested updates are difficult to type properly
        tanstackForm.setFieldValue(parent, updatedValue);
      } else {
        // @ts-expect-error Field values can be of various types
        tanstackForm.setFieldValue(fieldPath, value);
      }
      if (validationErrors[fieldPath]) {
        setValidationErrors({
          ...validationErrors,
          [fieldPath]: false,
        });
      }
    },
    reset: (values?: Partial<AvailabilityFormValues>) => {
      tanstackForm.reset(values || {});
    },
    handleSubmit: () => {
      tanstackForm.handleSubmit();
    },
    state: {
      values: tanstackForm.state.values as AvailabilityFormValues,
    },
  };

  return (
    <AvailabilityFormContext.Provider
      value={{
        form: formAdapter,
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
    </AvailabilityFormContext.Provider>
  );
}
