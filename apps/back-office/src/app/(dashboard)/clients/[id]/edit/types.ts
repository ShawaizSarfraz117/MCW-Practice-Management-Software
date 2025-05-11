// Client related types
export interface Contact {
  id?: string;
  value: string;
  contact_type: string;
  type: string;
  permission: string;
  is_primary?: boolean;
}

export interface ClientData {
  id?: string;
  legal_first_name: string;
  legal_last_name: string;
  preferred_name?: string;
  middle_name?: string;
  suffix?: string;
  relationship_type: string;
  is_emergency_contact?: boolean;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  }[];
  notes?: string;
  contacts: Contact[];
}

export interface EmailEntry {
  id?: string;
  value: string;
  type: string;
  permission: string;
}

export interface PhoneEntry {
  id?: string;
  value: string;
  type: string;
  permission: string;
}

export interface AddressEntry {
  id?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface ClientFormValues {
  id?: string;
  legal_first_name: string;
  legal_last_name: string;
  preferred_name?: string;
  middle_name?: string;
  suffix?: string;
  date_of_birth?: string;
  emails: EmailEntry[];
  phones: PhoneEntry[];
  addresses: AddressEntry[];
  relationship_type?: string;
  is_emergency_contact?: boolean;
  sex?: string;
  gender_identity?: string;
  relationship_status?: string;
  employment_status?: string;
  race_ethnicity?: string[];
  race_ethnicity_details?: string;
  preferred_language?: string;
  notes?: string;
}

// Default empty form values for initialization
export const defaultFormValues: ClientFormValues = {
  legal_first_name: "",
  legal_last_name: "",
  middle_name: "",
  suffix: "",
  preferred_name: "",
  relationship_type: "Family Member",
  is_emergency_contact: false,
  emails: [],
  phones: [],
  addresses: [],
  notes: "",
  date_of_birth: "",
  sex: "Prefer not to say",
  gender_identity: "",
  relationship_status: "No answer",
  employment_status: "No answer",
  race_ethnicity: [],
  race_ethnicity_details: "",
  preferred_language: "No answer",
};
