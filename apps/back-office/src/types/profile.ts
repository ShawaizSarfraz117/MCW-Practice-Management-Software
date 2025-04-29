export interface MenuItem {
  label: string;
  id?: string;
  description?: string;
  children?: MenuItem[];
}

export interface ProfileSidebarProps {
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
}

export interface ProfileData {
  created_at: string;
  date_of_birth: string;
  id: string;
  phone: string;
  profile_photo: string;
  updated_at: string;
  user_id: string;
}

export interface LicenseInfo {
  license_number: string; // License number as a string
  expiration_date: string; // Expiration date as a string (consider using Date if you want to handle dates)
  state: string; // State as a string
  license_type: string; // License type as a string
}

export interface ClinicalInfo {
  speciality: string;
  taxonomy_code: string;
  NPI_number: number;
}

export interface PracticeInformation {
  practice_name: string;
  practice_email: string;
  time_zone: string;
  practice_logo: string;
  phone_numbers: {
    number: string;
    type: string;
  }[];
  telehealth_enabled: boolean;
  telehealth: {
    office_name: string;
    color: string;
    service_place: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  };
}
