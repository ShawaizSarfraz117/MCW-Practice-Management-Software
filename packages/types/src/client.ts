// Client-related types and enums

export enum ContactType {
  EMAIL = "EMAIL",
  PHONE = "PHONE",
  SMS = "SMS",
}

export enum ContactPermission {
  CLIENT_ONLY = "CLIENT_ONLY",
  EMERGENCY_CONTACT_ONLY = "EMERGENCY_CONTACT_ONLY",
  ALL = "ALL",
}

export enum ContactSubType {
  HOME = "HOME",
  WORK = "WORK",
  MOBILE = "MOBILE",
  OTHER = "OTHER",
}

export interface ClientContact {
  id: string;
  client_id: string;
  is_primary: boolean;
  permission: string;
  contact_type: ContactType | string;
  type: ContactSubType | string;
  value: string;
}

export interface ClientWithContacts {
  id: string;
  legal_first_name: string;
  legal_last_name: string;
  preferred_name?: string;
  is_active: boolean;
  is_waitlist: boolean;
  ClientContact?: ClientContact[];
}
