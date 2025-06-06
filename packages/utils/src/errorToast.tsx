"use client";

import React from "react";

interface ErrorToastContentProps {
  message: string;
  issueId?: string;
  error?: unknown;
}

export const ErrorToastContent: React.FC<ErrorToastContentProps> = ({
  message,
  issueId,
  error,
}) => {
  const isProduction = process.env.NODE_ENV === "production";

  const handleCopyIssueId = () => {
    if (issueId) {
      navigator.clipboard.writeText(issueId);
    }
  };

  const handleShowDetails = () => {
    if (error) {
      console.error("Full error details:", error);
      if (error instanceof Error && error.stack) {
        console.error("Stack trace:", error.stack);
      }
    }
  };

  return (
    <div className="space-y-2 select-text">
      <p className="select-text">{message}</p>
      {issueId && (
        <div className="flex items-center gap-2 text-xs opacity-70">
          <span className="font-mono select-text">{issueId}</span>
          <button
            onClick={handleCopyIssueId}
            className="underline hover:no-underline cursor-pointer"
            type="button"
          >
            Copy ID
          </button>
          {!isProduction && (
            <button
              onClick={handleShowDetails}
              className="underline hover:no-underline cursor-pointer"
              type="button"
            >
              Show Details
            </button>
          )}
        </div>
      )}
    </div>
  );
};

interface ToastFunction {
  (props: {
    title: string;
    description: React.ReactNode;
    variant?: "default" | "destructive" | "success";
  }): void;
}

/**
 * Helper function to display error toasts with proper formatting
 */
export function showErrorToast(toast: ToastFunction, error: unknown) {
  let errorMessage = "An error occurred";
  let issueId: string | undefined;
  let errorDetails: unknown = error;

  // Log full error in development
  if (process.env.NODE_ENV !== "production") {
    console.error("API Error Details:", error);
  }

  // Extract error details based on our API response format
  if (error && typeof error === "object" && "error" in error) {
    const apiError = error as { error?: unknown };

    // Handle both { error: "string" } and { error: { message: "string", issueId: "string" } }
    if (typeof apiError.error === "string") {
      errorMessage = apiError.error;
      errorDetails = apiError.error;
    } else if (apiError.error && typeof apiError.error === "object") {
      errorMessage = apiError.error.message || "An error occurred";
      issueId = apiError.error.issueId;
      errorDetails = apiError.error;

      // Log stack trace in development
      if (process.env.NODE_ENV !== "production" && apiError.error.stack) {
        console.error("Stack trace:", apiError.error.stack);
      }
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
    errorDetails = error;

    // Log stack trace in development
    if (process.env.NODE_ENV !== "production" && error.stack) {
      console.error("Stack trace:", error.stack);
    }
  } else if (typeof error === "string") {
    errorMessage = error;
    errorDetails = error;
  }

  toast({
    title: "Error",
    description: (
      <ErrorToastContent
        message={errorMessage}
        issueId={issueId}
        error={errorDetails}
      />
    ),
    variant: "destructive",
  });
}
