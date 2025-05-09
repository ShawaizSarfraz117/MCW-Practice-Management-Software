export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: string;
  isActive: boolean;
}

export interface UpdateTemplateData {
  name: string;
  subject: string;
  content: string;
  type: string;
  isActive?: boolean;
}

export interface EmailTemplateEditSidebarProps {
  open: boolean;
  onClose: () => void;
  template: EmailTemplate | null;
  onSave: (formData: UpdateTemplateData) => void;
  isUpdating?: boolean;
}

export interface ClientGroupData {
  id: string;
  name: string;
  type: string;
  ClientGroupMembership?: Array<{
    Client: {
      legal_first_name: string;
      legal_last_name: string;
      ClientContact: Array<{
        type: string;
        value: string;
        contact_type: string;
      }>;
    };
  }>;
}

export interface ClinicianData {
  id: string;
  first_name: string;
  last_name: string;
  User?: {
    email: string;
  };
}

export type MacroKey =
  | "clinician"
  | "clinician_full_name"
  | "clinician_first_name"
  | "clinician_last_name"
  | "clinician_email"
  | "practice"
  | "practice_address_line1"
  | "practice_address_line2"
  | "practice_city"
  | "practice_email"
  | "practice_full_name"
  | "practice_full_office_address"
  | "practice_location"
  | "practice_name"
  | "practice_phone_number"
  | "practice_state"
  | "practice_video_location"
  | "practice_zip_code"
  | "practice_map_link"
  | "client"
  | "client_document_requests_size"
  | "client_document_request_names"
  | "client_full_name"
  | "client_full_name_formatted"
  | "client_first_name"
  | "client_first_name_formatted"
  | "client_last_name"
  | "client_mobile_number"
  | "client_home_number"
  | "client_work_number"
  | "client_fax_number"
  | "client_email_address"
  | "client_address_line1"
  | "client_address_line2"
  | "client_city"
  | "client_zip_code"
  | "client_state"
  | "client_birth_date"
  | "client_gender"
  | "client_first_appointment_date"
  | "client_first_appointment_time"
  | "client_most_recent_appointment_date"
  | "client_most_recent_appointment_time"
  | "client_next_appointment_date"
  | "client_next_appointment_time"
  | "client_legally_admissible_first_name"
  | "recipient_legally_admissible_first_name"
  | "links"
  | "appointment_reminder_links"
  | "date"
  | "time";

export type MacroMap = Record<MacroKey, string>;
