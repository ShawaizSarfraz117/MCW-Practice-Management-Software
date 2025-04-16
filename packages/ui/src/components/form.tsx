"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import {
  Field,
  useField,
  useForm as useTanstackForm,
} from "@tanstack/react-form";

import { cn } from "@mcw/utils";
import { Label } from "@mcw/ui";

// Create a form context using React's createContext
const FormContext = React.createContext({});

// Form component that provides form context
function Form({
  children,
  ...props
}: {
  children: React.ReactNode;
  [key: string]: unknown;
}) {
  return <FormContext.Provider value={props}>{children}</FormContext.Provider>;
}

// Use a Field context to track the current field
type FormFieldContextValue = {
  name: string;
};

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue,
);

// FormField component to replace Controller
function FormField({
  name,
  children,
  ...props
}: {
  name: string;
  children:
    | React.ReactNode
    | ((props: Record<string, unknown>) => React.ReactNode);
  [key: string]: unknown;
}) {
  return (
    <FormFieldContext.Provider value={{ name }}>
      {typeof children === "function" ? children(props) : children}
    </FormFieldContext.Provider>
  );
}

// Hook to get field information
const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    // Since we don't have direct access to field state like in react-hook-form,
    // consumers will need to access validation state differently
    error: null,
  };
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue,
);

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  );
});
FormItem.displayName = "FormItem";

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { formItemId } = useFormField();

  return (
    <Label
      ref={ref}
      className={cn(className)}
      htmlFor={formItemId}
      {...props}
    />
  );
});
FormLabel.displayName = "FormLabel";

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { formItemId, formDescriptionId, formMessageId } = useFormField();

  return (
    <Slot
      ref={ref}
      aria-describedby={`${formDescriptionId} ${formMessageId}`}
      id={formItemId}
      {...props}
    />
  );
});
FormControl.displayName = "FormControl";

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField();

  return (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      id={formDescriptionId}
      {...props}
    />
  );
});
FormDescription.displayName = "FormDescription";

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { formMessageId } = useFormField();

  if (!children) {
    return null;
  }

  return (
    <p
      ref={ref}
      className={cn("text-sm font-medium text-destructive", className)}
      id={formMessageId}
      {...props}
    >
      {children}
    </p>
  );
});
FormMessage.displayName = "FormMessage";

// Helper function to create a form
function useForm<TValues = Record<string, unknown>>(options = {}) {
  // @ts-expect-error TanStack form has complex generic types that we're simplifying here
  return useTanstackForm<TValues>(options);
}

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
  useForm,
  Field,
  useField,
};
