// Calendar component types

import { EventClickArg } from "@fullcalendar/core";

export interface Clinician {
  first_name?: string;
  last_name?: string;
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
  resourceId: string;
  title: string;
  start: string;
  end: string;
  location: string;
}

export interface AppointmentData {
  id: string;
  type: string;
  title: string;
  start_date: string;
  end_date: string;
  location_id: string;
  client_id?: string;
  clinician_id?: string;
  status: string;
  is_all_day: boolean;
  is_recurring: boolean;
  recurring_rule?: string;
  service_id?: string;
  appointment_fee?: number;
  notes?: string;
  Client?: {
    id: string;
    legal_first_name: string;
    legal_last_name: string;
    preferred_name?: string;
  };
  Clinician?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  Location?: {
    id: string;
    name: string;
    address: string;
  };
  services?: Array<{
    id: string;
    name: string;
    code: string;
    rate: number;
    duration: number;
  }>;
}

export interface CalendarViewProps {
  initialClinicians: Clinician[];
  initialLocations: Location[];
  initialEvents: Event[];
  onCreateClient?: (date: string, time: string) => void;
  onAppointmentDone?: () => void;
  onEventClick?: (info: EventClickArg) => void;
  onDateSelect?: (selectInfo: {
    start: Date;
    end: Date;
    resource?: { id: string };
  }) => void;
}

// Define FormValues interface to match the appointment dialog's form values
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
