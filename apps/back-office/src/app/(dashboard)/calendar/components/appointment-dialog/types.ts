import { RecurringInfo } from "../calendar/types";
import type {
  AppointmentWithRelations,
  Service as BaseService,
  Clinician as BaseClinician,
  Location as BaseLocation,
  Client as BaseClient,
  ClientGroup as BaseClientGroup,
} from "@/types/entities";

/**
 * @deprecated Use centralized Service type from @mcw/types
 * TODO: [TYPE-MIGRATION-DUPLICATE] 3 of 6+ Service definitions
 * TODO: [TYPE-MIGRATION] Move extended fields to @mcw/types/entities/service
 * TODO: [TYPE-MIGRATION-CASING] Keep snake_case, use ServiceUI for components
 */
export interface Service extends BaseService {
  is_default: boolean;
  type: string;
  code: string;
  duration: number;
  block_before: number;
  block_after: number;
  available_online: boolean;
  allow_new_clients: boolean;
  bill_in_units: boolean;
  description: string | null;
  require_call: boolean;
  color: string | null;
}

/**
 * @deprecated Use centralized Clinician type from @mcw/types
 * TODO: [TYPE-MIGRATION-DUPLICATE] 3 of 4+ Clinician definitions
 * TODO: [TYPE-MIGRATION] Extend base type with is_active in shared types
 */
export interface Clinician extends BaseClinician {
  is_active: boolean;
}

/**
 * @deprecated Use centralized Location type from @mcw/types
 * TODO: [TYPE-MIGRATION-DUPLICATE] 4 of 5+ Location definitions
 * TODO: [TYPE-MIGRATION] Extend base type with is_active in shared types
 */
export interface Location extends BaseLocation {
  is_active: boolean;
}

/**
 * @deprecated Use centralized Client type from @mcw/types
 * TODO: [TYPE-MIGRATION-DUPLICATE] 2 of 3+ Client definitions
 * TODO: [TYPE-MIGRATION] Import ClientUI from @mcw/types instead
 * TODO: [TYPE-MIGRATION-CASING] This has mixed casing - standardize with ClientUI type
 */
export interface Client extends BaseClient {
  legal_first_name?: string;
  legal_last_name?: string;
  firstName?: string;
  lastName?: string;
  is_active?: boolean;
}

/**
 * @deprecated Use centralized ClientGroup type from @mcw/types
 * TODO: [TYPE-MIGRATION-DUPLICATE] 2 of 3+ ClientGroup definitions
 * TODO: [TYPE-MIGRATION] Extend base type in shared types
 */
export interface ClientGroup extends BaseClientGroup {
  type: string;
}

export type AppointmentData = AppointmentWithRelations;

export interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  selectedDate?: Date | null;
  selectedResource?: string | null;
  onCreateClient?: (date: string, time: string) => void;
  onDone?: () => void;
  appointmentData?: AppointmentData;
  isViewMode?: boolean;
}

export interface FormValues {
  type: "appointment" | "event";
  eventName: string;
  clientType: "individual" | "group";
  client?: string | null;
  clientGroup?: string | null;
  clinician: string;
  selectedServices: Array<{ serviceId: string; fee: number }>;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  location: string;
  recurring: boolean;
  allDay: boolean;
  cancelAppointments: boolean;
  notifyClients: boolean;
  recurringInfo?: RecurringInfo;
}

export interface FormInterface {
  // Make this more generic to be compatible with ReactFormExtendedApi
  getFieldValue: <T = unknown>(field: string | keyof FormValues) => T;
  setFieldValue: (
    field: string | keyof FormValues,
    value: unknown,
    options?: unknown,
  ) => void;
  reset: (values?: Partial<FormValues>) => void;
  handleSubmit?: () => void;
  state?: {
    values: FormValues;
  };
  [key: string]: unknown;
}

export interface FormContextType {
  form: FormInterface;
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

export interface AppointmentTabProps {
  onCreateClient?: (date: string, time: string) => void;
  selectedDate?: Date | null;
  _selectedDate?: Date | null;
  appointmentData?: AppointmentData;
  onDone?: () => void;
}

export interface EventTabProps {
  // This interface can be expanded in the future as needed
  [key: string]: never;
}

export interface UseAppointmentDataProps {
  open: boolean;
  selectedDate?: Date | null;
  effectiveClinicianId?: string | null;
  isViewMode?: boolean;
  appointmentData?: AppointmentData;
  setAppointmentFormValues: (values: FormValues) => void;
  setEventFormValues: (values: FormValues) => void;
  setActiveTab: (tab: "appointment" | "event" | "out") => void;
  form: FormInterface;
}

export interface AppointmentFormData {
  startDate: Date | null;
  endDate: Date | null;
  startTime: string | null;
  endTime: string | null;
  type?: string;
  allDay?: boolean;
  location?: string;
  status?: string;
  selectedServices?: Array<{ serviceId: string; fee: number }>;
  recurring?: boolean;
  recurringInfo?: {
    period: string;
    frequency?: string;
    selectedDays?: string[];
    monthlyPattern?: string;
    endType?: string;
    endValue?: string | number;
  };
}
