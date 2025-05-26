// Availability-specific form types
import { AppointmentData } from "../appointment-dialog/types";

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

// AvailabilitySidebar specific types
export interface AvailabilitySidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  selectedResource: string | null;
  onClose: () => void;
  availabilityData?: {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
    location: string;
    clinician_id: string;
    allow_online_requests: boolean;
    is_recurring: boolean;
    recurring_rule: string | null;
    service_id?: string;
  };
  isEditMode?: boolean;
}

export interface Service {
  id: string;
  type: string;
  code: string;
  duration: number;
  description?: string;
  rate: number;
  defaultRate?: number;
  color?: string;
  isActive?: boolean;
  isDefault?: boolean;
  billInUnits?: boolean;
  availableOnline?: boolean;
  allowNewClients?: boolean;
  requireCall?: boolean;
  blockBefore?: number;
  blockAfter?: number;
}

// Component-specific types
export interface AppointmentSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  selectedResource: string | null;
  onCreateClient?: (date: string, time: string) => void;
  onDone: () => void;
  appointmentData?: AppointmentData;
  isViewMode?: boolean;
  timeSlot?: {
    startTime: string;
    endTime: string;
    duration: string;
  };
  onClose: () => void;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  is_active: boolean;
}

export interface DetailedService {
  id: string;
  type: string;
  code: string;
  description?: string;
  duration: number;
  defaultRate?: number;
  customRate?: number;
  effectiveRate?: number;
  rate: number;
  color?: string;
  isActive?: boolean;
  isDefault?: boolean;
  billInUnits?: boolean;
  availableOnline?: boolean;
  allowNewClients?: boolean;
  requireCall?: boolean;
  blockBefore?: number;
  blockAfter?: number;
}

export interface AvailabilityService {
  id: string;
  type: string;
  code: string;
  description?: string;
  duration: number;
  rate: number;
  defaultRate?: number;
  color?: string;
  isDefault?: boolean;
  billInUnits?: boolean;
  availableOnline?: boolean;
  allowNewClients?: boolean;
  requireCall?: boolean;
  blockBefore?: number;
  blockAfter?: number;
}
