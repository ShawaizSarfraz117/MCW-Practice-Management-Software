export * from "./formatting";
export * from "./styles";
export * from "./surveyjs";
export * from "./surveyjs-custom";
export * from "./errorToast";
export * from "./survey-scoring";

// Re-export server utilities for backward compatibility
// These should be imported from @mcw/utils/server in client components
export * from "./test-utils";
export * from "./fetch";
export * from "./withErrorHandling";

// Example validation utility
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Example formatting utility
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
