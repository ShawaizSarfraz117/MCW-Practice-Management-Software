interface ClientData {
  legalFirstName?: string;
  legalLastName?: string;
  dob?: string;
  emails?: Array<{ value: string }>;
  phones?: Array<{ value: string }>;
}

export interface ValidationErrors {
  [key: string]: string[];
}

export function validateClient(
  client: ClientData | null,
  isContactTab: boolean,
): ValidationErrors {
  if (!client) return {};

  const errors: ValidationErrors = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Required field validations
  if (!client.legalFirstName?.trim()) {
    errors.legalFirstName = ["First name is required"];
  }

  if (!client.legalLastName?.trim()) {
    errors.legalLastName = ["Last name is required"];
  }

  // DOB validation - only for non-contact tabs
  if (!isContactTab && !client.dob?.trim()) {
    errors.dob = ["Date of Birth is required"];
  }

  // Contact method validation
  const hasValidEmail =
    client.emails?.some(
      (e) => e.value.trim() !== "" && emailRegex.test(e.value),
    ) ?? false;

  const hasValidPhone =
    client.phones?.some((p) => p.value.trim() !== "") ?? false;

  if (!hasValidEmail && !hasValidPhone) {
    errors.emails = [
      "At least one valid contact method (email or phone) is required",
    ];
  }

  return errors;
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}
