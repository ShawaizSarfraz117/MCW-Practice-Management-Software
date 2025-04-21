export type Service = {
  id: string;
  type: string;
  code: string;
  duration: number;
  description: string | null;
  rate?: number;
};

export type Clinician = {
  id: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
};

export type Location = {
  id: string;
  name: string;
  address: string;
  is_active: boolean;
};

export type Client = {
  id: string;
  legal_first_name?: string;
  legal_last_name?: string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  is_active?: boolean;
  [key: string]: unknown;
};

export interface AppointmentData {
  id?: string;
  start_date?: string;
  recurring_rule: string;
  status?: string;
  notes?: string;
  end_date?: string;
  title?: string;
  type?: string;
  client_id?: string;
  PracticeService?: Service;
  appointment_fee?: number;
  Clinician?: Clinician;
  clinician_id?: string;
  Client?: Client;
  location_id?: string;
  is_recurring?: boolean;
  is_all_day?: boolean;
  services?: Array<{
    id: string;
    rate: number;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

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
  type: string;
  eventName: string;
  clientType: string;
  client: string;
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
  recurringInfo?: {
    frequency: string;
    period: string;
    selectedDays: string[];
    monthlyPattern?: string;
    endType: string;
    endValue: string | undefined;
  };
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
  client?: string;
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
