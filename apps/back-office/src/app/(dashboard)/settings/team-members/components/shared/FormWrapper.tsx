import React from "react";
import { FormMessage } from "@mcw/ui";

interface FormHeaderProps {
  title: string;
  description: string;
}

export const FormHeader: React.FC<FormHeaderProps> = ({
  title,
  description,
}) => (
  <div className="space-y-1.5">
    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    <p className="text-sm text-gray-500">{description}</p>
  </div>
);

interface FormWrapperProps {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
}

export const FormWrapper: React.FC<FormWrapperProps> = ({
  children,
  onSubmit,
}) => (
  <form
    className="space-y-6"
    onSubmit={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onSubmit(e);
    }}
  >
    {children}
    <div className="flex justify-end">
      <button className="hidden" type="submit" />
    </div>
  </form>
);

interface FormFieldProps {
  children: React.ReactNode;
  errors?: string[];
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  children,
  errors = [],
  className = "",
}) => (
  <div className={className}>
    {children}
    {errors.length > 0 && <FormMessage>{errors[0]}</FormMessage>}
  </div>
);

export const getFieldStyles = (hasErrors: boolean): string =>
  hasErrors ? "border-red-500" : "";
