import { EventClickArg, DateSelectArg, EventApi } from "@fullcalendar/core";
import type {
  BaseAppointment,
  Clinician as BaseClinicianType,
  Location as BaseLocationType,
} from "@/types/entities";

// Extend EventApi to include internal _def property used by FullCalendar resource plugin
export interface EventApiWithResourceIds extends EventApi {
  _def?: {
    resourceIds?: string[];
  };
}

// Calendar component types
/**
 * @deprecated Use centralized Clinician type from @mcw/types
 * TODO: [TYPE-MIGRATION-DUPLICATE] 2 of 4+ Clinician definitions
 * TODO: [TYPE-MIGRATION] This extends base type with UI fields - keep as UI-specific
 */
export interface Clinician extends Partial<BaseClinicianType> {
  value: string;
  label: string;
  group: string;
}

/**
 * @deprecated Use centralized Location type from @mcw/types
 * TODO: [TYPE-MIGRATION-DUPLICATE] 3 of 5+ Location definitions
 * TODO: [TYPE-MIGRATION] This extends base type with UI fields - keep as UI-specific
 */
export interface Location extends Partial<BaseLocationType> {
  value: string;
  label: string;
  type: "physical" | "virtual" | "unassigned";
}

export interface CalendarEvent {
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

export type AppointmentData = BaseAppointment;

/**
 * @deprecated Move to @mcw/types/entities/availability
 * TODO: [TYPE-MIGRATION] This is a shared type
 * TODO: [TYPE-MIGRATION-CASING] Keep snake_case, create AvailabilityUI type for components
 */
export interface AvailabilityData {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  location?: string;
  location_id?: string;
  clinician_id: string;
  allow_online_requests: boolean;
  is_recurring: boolean;
  recurring_rule: string | null;
  Clinician?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export interface CalendarViewProps {
  initialClinicians: Clinician[];
  initialLocations: Location[];
  initialEvents: CalendarEvent[];
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
  isScheduledPage?: boolean;
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
