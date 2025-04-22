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
