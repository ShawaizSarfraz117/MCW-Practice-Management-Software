export interface BaseAppointment {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  location_id: string;
  clinician_id: string;
  client_id?: string;
  status: string;
  type: string;
  is_all_day?: boolean;
  notes?: string;
  is_recurring?: boolean;
  recurring_rule?: string | null;
  appointment_fee?: number;
}

export interface AppointmentService {
  id: string;
  rate: number;
  [key: string]: unknown;
}

export interface AppointmentWithRelations extends BaseAppointment {
  PracticeService?: Service;
  Clinician?: Clinician;
  Client?: Client;
  ClientGroup?: ClientGroup;
  services?: AppointmentService[];
  [key: string]: unknown;
}

export interface AppointmentFormData {
  id?: string;
  title?: string;
  type?: string;
  location_id?: string;
  client_id?: string;
  clinician_id?: string;
  is_all_day?: boolean;
  notes?: string;
  start_date?: string;
  end_date?: string;
  recurring_rule?: string | null;
  status?: string;
  appointment_fee?: number;
}

export interface Service {
  id: string;
  name: string;
  rate?: number;
  [key: string]: unknown;
}

export interface Clinician {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  speciality?: string;
  NPI_number?: string;
  [key: string]: unknown;
}

export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  [key: string]: unknown;
}

export interface ClientGroup {
  id: string;
  name?: string;
  [key: string]: unknown;
}

export interface Location {
  id: string;
  name: string;
  address?: string;
  [key: string]: unknown;
}
