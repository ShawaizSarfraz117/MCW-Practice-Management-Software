// Calendar-related types

export interface CalendarClinician {
  id: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  User: {
    email: string;
  };
}

export interface CalendarLocation {
  id: string;
  name: string;
  address: string;
  address_line1?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  is_active: boolean;
}

export interface CalendarService {
  id: string;
  type: string;
  description: string;
  code: string;
  duration: number;
  rate: number;
  color: string;
  is_active: boolean;
}

export interface CalendarAppointment {
  id: string;
  client_group_id?: string;
  client_id?: string;
  clinician_id?: string;
  location: string;
  location_id: string;
  start_date: string;
  end_date: string;
  status: string;
  type: string;
  title: string;
  is_all_day: boolean;
  is_recurring: boolean;
  recurring_appointment_id?: string;
  recurring_rule?: string | null;
  created_at?: string;
  updated_at?: string;
  isFirstAppointmentForGroup?: boolean;
  Client?: {
    id: string;
    legal_first_name: string;
    legal_last_name: string;
    preferred_name?: string;
  };
  ClientGroup?: {
    ClientGroupMembership: Array<{
      is_primary_patient: boolean;
      is_contact_only: boolean;
      Client: {
        legal_first_name: string;
        legal_last_name: string;
      };
    }>;
  };
  PracticeService?: {
    id: string;
    type: string;
    color: string;
  };
  Location?: {
    id: string;
    name: string;
    address: string;
  };
  Clinician?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  AvailabilityService?: Array<{
    service_id: string;
    PracticeService: {
      id: string;
      name: string;
      color: string;
    };
  }>;
  AppointmentTag?: Array<{
    id: string;
    appointment_id: string;
    tag_id: string;
    Tag: {
      id: string;
      name: string;
      color: string;
    };
  }>;
}

export interface CalendarAvailability {
  id: string;
  clinician_id: string;
  title: string;
  start_date: string;
  end_date: string;
  location_id: string;
  allow_online_requests: boolean;
  is_recurring: boolean;
  recurring_rule: string | null;
  Location?: {
    id: string;
    name: string;
    address: string;
  };
  Clinician?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}
