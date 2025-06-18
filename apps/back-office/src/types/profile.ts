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

/**
 * @deprecated Move to @mcw/types/entities/profile
 * TODO: [TYPE-MIGRATION] This represents user profile data
 * TODO: [TYPE-MIGRATION-CASING] Keep snake_case, create ProfileUI type for components
 */
export interface ProfileData {
  created_at: string;
  date_of_birth: string;
  id: string;
  phone: string;
  profile_photo: string;
  updated_at: string;
  user_id: string;
}

/**
 * @deprecated Consolidate with other LicenseInfo definitions
 * TODO: [TYPE-MIGRATION-DUPLICATE] Different from team-member.ts version
 * TODO: [TYPE-MIGRATION] Move to @mcw/types/entities/license
 * TODO: [TYPE-MIGRATION-CASING] Keep snake_case, create LicenseUI type for components
 */
export interface LicenseInfo {
  license_number: string; // License number as a string
  expiration_date: string; // Expiration date as a string (consider using Date if you want to handle dates)
  state: string; // State as a string
  license_type: string; // License type as a string
}

/**
 * @deprecated Move to @mcw/types/entities/clinical-info
 * TODO: [TYPE-MIGRATION] Consolidate with ClinicianInfo type
 * TODO: [TYPE-MIGRATION-CASING] Keep snake_case, create ClinicalInfoUI type
 */
export interface ClinicalInfo {
  speciality: string;
  taxonomy_code: string;
  NPI_number: number;
}

/**
 * @deprecated Move to @mcw/types/entities/practice
 * TODO: [TYPE-MIGRATION] This is shared practice information
 * TODO: [TYPE-MIGRATION-CASING] Keep snake_case, create PracticeUI type for components
 */
export interface PracticeInformation {
  practice_name: string;
  practice_email: string;
  time_zone: string;
  practice_logo: string;
  phone_numbers: {
    number: string;
    type: string;
  }[];
  tele_health: boolean;
}
