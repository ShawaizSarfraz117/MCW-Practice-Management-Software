// Client related types
export interface Contact {
  id: string;
  value: string;
  contact_type: string;
  type: string;
  permission: string;
  is_primary?: boolean;
}

export interface ClientData {
  id: string;
  legal_first_name: string;
  legal_last_name: string;
  preferred_name?: string | null;
  middle_name?: string | null;
  suffix?: string | null;
  date_of_birth?: Date | null;
  is_active: boolean;
  address?: string | null;
  receive_reminders?: boolean;
  has_portal_access?: boolean;
  last_login_at?: Date | null;
  relationship_type?: string | null;
  notes?: string | null;
  time_zone?: string | null;
  is_responsible_for_billing?: boolean;
  is_waitlist?: boolean;
  ClientContact: Contact[];
}

export interface ClientMembership {
  client_id: string;
  client_group_id: string;
  created_at: Date;
  role: string | null;
  is_contact_only: boolean;
  is_responsible_for_billing: boolean | null;
  Client: ClientData;
}

// Form types
export interface EmailEntry {
  id?: string;
  value: string;
  type: string;
  permission: string;
  is_primary?: boolean;
}

export interface PhoneEntry {
  id?: string;
  value: string;
  type: string;
  permission: string;
  is_primary?: boolean;
}

export interface ClientGroupFromAPI {
  id: string;
  name: string;
  type: string;
  status?: string;
  notes?: string;
  is_active?: boolean;
  first_seen_at?: string;
  referred_by?: string;
  ClientGroupMembership: ClientMembership[];
}
