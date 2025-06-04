"use client";

interface ValidationErrorProps {
  show: boolean;
  message: string;
}

export function ValidationError({ show, message }: ValidationErrorProps) {
  if (!show) return null;

  return <p className="text-xs text-red-500 mt-1">{message}</p>;
}
