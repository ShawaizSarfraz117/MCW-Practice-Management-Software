/**
 * TODO: [TYPE-MIGRATION] Consider moving to @mcw/types/enums if used across apps
 */
export enum AppointmentTagName {
  NEW_CLIENT = "New Client",
  APPOINTMENT_UNPAID = "Appointment Unpaid",
  NO_NOTE = "No Note",
}

/**
 * @deprecated Move to @mcw/types/entities/appointment
 * TODO: [TYPE-MIGRATION] Create SafeAppointment type in shared types
 * TODO: [TYPE-MIGRATION-CASING] Keep snake_case, create AppointmentUI type for components
 */
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

/**
 * @deprecated Move to @mcw/types/entities/appointment-service
 * TODO: [TYPE-MIGRATION] This junction type should be shared
 */
export interface AppointmentService {
  id: string;
  rate: number;
  [key: string]: unknown;
}

/**
 * @deprecated Move to @mcw/types/entities/appointment
 * TODO: [TYPE-MIGRATION] Create SafeAppointmentWithRelations in shared types
 * TODO: [TYPE-MIGRATION-CASING] Keep snake_case, create AppointmentWithRelationsUI type
 */
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

/**
 * @deprecated Use centralized Service type from @mcw/types
 * TODO: [TYPE-MIGRATION-DUPLICATE] 1 of 6+ Service definitions
 * TODO: [TYPE-MIGRATION] Move to @mcw/types/entities/service
 * TODO: [TYPE-MIGRATION-CASING] Keep snake_case, create ServiceUI type for components
 */
export interface Service {
  id: string;
  name: string;
  rate?: number;
  [key: string]: unknown;
}

/**
 * @deprecated Use centralized Clinician type from @mcw/types
 * TODO: [TYPE-MIGRATION-DUPLICATE] 1 of 4+ Clinician definitions
 * TODO: [TYPE-MIGRATION] Move to @mcw/types/entities/clinician
 * TODO: [TYPE-MIGRATION-CASING] Keep snake_case, create ClinicianUI type for components
 */
export interface Clinician {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  speciality?: string;
  NPI_number?: string;
  [key: string]: unknown;
}

/**
 * @deprecated Use centralized Client type from @mcw/types
 * TODO: [TYPE-MIGRATION-DUPLICATE] 1 of 3+ Client definitions
 * TODO: [TYPE-MIGRATION] Move to @mcw/types/entities/client
 * TODO: [TYPE-MIGRATION-CASING] Keep snake_case, create ClientUI type for components
 */
export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  [key: string]: unknown;
}

/**
 * @deprecated Use centralized ClientGroup type from @mcw/types
 * TODO: [TYPE-MIGRATION-DUPLICATE] 1 of 3+ ClientGroup definitions
 * TODO: [TYPE-MIGRATION] Move to @mcw/types/entities/client-group
 */
export interface ClientGroup {
  id: string;
  name?: string;
  [key: string]: unknown;
}

/**
 * @deprecated Use centralized Location type from @mcw/types
 * TODO: [TYPE-MIGRATION-DUPLICATE] 1 of 5+ Location definitions
 * TODO: [TYPE-MIGRATION] Move to @mcw/types/entities/location
 */
export interface Location {
  id: string;
  name: string;
  address?: string;
  [key: string]: unknown;
}
