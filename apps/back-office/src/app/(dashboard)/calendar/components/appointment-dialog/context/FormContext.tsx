"use client";

import { createContext, useContext, ReactNode } from "react";
import { FormContextType, FormInterface, FormValues } from "../types";
import { useForm } from "@tanstack/react-form";

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
  form?: FormInterface; // Make optional since we'll provide our own form
  validationErrors: Record<string, boolean>;
  setValidationErrors: (errors: Record<string, boolean>) => void;
  setGeneralError: (error: string | null) => void;
  duration: string;
  forceUpdate: () => void;
  effectiveClinicianId?: string | null;
  isAdmin?: boolean;
  isClinician?: boolean;
  shouldFetchData?: boolean;
  initialValues?: Partial<FormValues>;
}

export function FormProvider({
  children,
  form: externalForm, // Renamed from form to externalForm
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
}: FormProviderProps) {
  // Create the TanStack form
  // @ts-expect-error TanStack form has complex generic types that we're simplifying here
  const tanstackForm = useForm<Partial<FormValues>>({
    defaultValues: initialValues || {},
    onSubmit: async () => {
      // This will be handled by the parent component
    },
  });

  // Create an adapter that implements the FormInterface expected by consumers
  const formAdapter: FormInterface = externalForm || {
    getFieldValue: <T = unknown,>(field: string | keyof FormValues): T => {
      // Safely access nested fields by using string paths
      const fieldPath = field.toString();

      // Use a properly typed reduce function
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
    setFieldValue: (field: string | keyof FormValues, value: unknown) => {
      // For simple fields we can use setFieldValue directly
      const fieldPath = field.toString();

      // Handle nested fields
      if (fieldPath.includes(".")) {
        const [parent, ...parts] = fieldPath.split(".");
        const currentParentValue =
          tanstackForm.getFieldValue(parent as keyof FormValues) || {};

        // Update the nested value
        const updatedValue = { ...currentParentValue } as Record<
          string,
          unknown
        >;
        let current = updatedValue;
        const pathParts = parts.slice(0, -1);
        const finalKey = parts[parts.length - 1];

        // Build the path to the nested value
        for (const part of pathParts) {
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part] as Record<string, unknown>;
        }

        // Set the final value
        current[finalKey] = value;

        // Type-safe update using type assertion
        // @ts-expect-error Complex nested updates are difficult to type properly
        tanstackForm.setFieldValue(parent, updatedValue);
      } else {
        // For top-level fields with type assertion
        // @ts-expect-error Field values can be of various types
        tanstackForm.setFieldValue(fieldPath, value);
      }

      // Clear validation errors when a field gets a value
      if (validationErrors[fieldPath]) {
        setValidationErrors({
          ...validationErrors,
          [fieldPath]: false,
        });
      }
    },
    reset: (values?: Partial<FormValues>) => {
      tanstackForm.reset(values || {});
    },
    handleSubmit: () => {
      tanstackForm.handleSubmit();
    },
    state: {
      values: tanstackForm.state.values as FormValues,
    },
  };

  return (
    <FormContext.Provider
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
    </FormContext.Provider>
  );
}
