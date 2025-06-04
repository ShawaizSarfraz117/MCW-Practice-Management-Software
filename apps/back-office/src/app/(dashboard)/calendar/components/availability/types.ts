// Availability-specific form types

export interface AvailabilityFormValues {
  title: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  allDay: boolean;
  type: "availability";
  clinician: string;
  location: string;
  allowOnlineRequests: boolean;
  isRecurring: boolean;
  recurringRule?: string | null;
  selectedServices?: string[];
}

export interface AvailabilityFormInterface {
  getFieldValue: <T = unknown>(
    field: string | keyof AvailabilityFormValues,
  ) => T;
  setFieldValue: (
    field: string | keyof AvailabilityFormValues,
    value: unknown,
    options?: unknown,
  ) => void;
  reset: (values?: Partial<AvailabilityFormValues>) => void;
  handleSubmit?: () => void;
  state?: {
    values: AvailabilityFormValues;
  };
  [key: string]: unknown;
}

export interface AvailabilityFormContextType {
  form: AvailabilityFormInterface;
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
