import { EventClickArg, DateSelectArg } from "@fullcalendar/core";

// Calendar component types
export interface Clinician {
  first_name?: string;
  last_name?: string;
  user_id?: string;
  id?: string;
  value: string;
  label: string;
  group: string;
}

export interface Location {
  value: string;
  label: string;
  type: "physical" | "virtual" | "unassigned";
}

export interface Event {
  id: string;
  resourceId?: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  allDay?: boolean;
  status?: string;
  display?: string;
  backgroundColor?: string;
  classNames?: string[];
  extendedProps?: {
    type: "appointment" | "availability";
    allow_online_requests?: boolean;
    is_recurring?: boolean;
    recurring_rule?: string | null;
  };
}

export interface AppointmentData {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  location_id: string;
  clinician_id: string;
  client_id?: string;
  status: string;
  type: string;
}

export interface AvailabilityData {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  location: string;
  clinician_id: string;
  allow_online_requests: boolean;
  is_recurring: boolean;
  recurring_rule: string | null;
}

export interface CalendarViewProps {
  initialClinicians: Clinician[];
  initialLocations: Location[];
  initialEvents: Event[];
  onCreateClient: (date: string, time: string) => void;
  onAppointmentDone: () => void;
  onEventClick?: (info: EventClickArg) => void;
  onDateSelect?: (info: DateSelectArg) => void;
  isScheduledPage?: boolean;
}

// Define FormValues interface to match the appointment dialog's form values
export interface FormValues {
  clientType: string;
  type?: string;
  eventName?: string;
  client?: string;
  clientGroup?: string;
  startDate: Date;
  endDate: Date;
  startTime?: string;
  endTime?: string;
  location?: string;
  clinician?: string;
  recurring?: boolean;
  allDay?: boolean;
  selectedServices?: Array<{
    serviceId: string;
    fee: number;
  }>;
  recurringInfo?: {
    frequency: string;
    period: string;
    selectedDays: string[];
    monthlyPattern?: string;
    endType: string;
    endValue: string | undefined;
  };
}

export const clinicianGroups = {
  clinicians: "CLINICIANS",
  admins: "ADMINS",
};

export interface CalendarToolbarProps {
  currentDate: Date;
  currentView: string;
  isAdmin: boolean;
  initialClinicians: Clinician[];
  initialLocations: Location[];
  selectedLocations: string[];
  selectedClinicians: string[];
  setSelectedClinicians: (clinicians: string[]) => void;
  setSelectedLocations: (locations: string[]) => void;
  handlePrev: () => void;
  handleNext: () => void;
  handleToday: () => void;
  handleViewChange: (view: string) => void;
  getHeaderDateFormat: () => string;
}

export interface RecurringInfo {
  frequency: string;
  period: string;
  selectedDays: string[];
  monthlyPattern?: string;
  endType: string;
  endValue: string | undefined;
}

export interface FormInterface {
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  allDay: boolean;
  type: string;
  clinician: string;
  location: string;
  eventName: string;
  recurring: boolean;
}
