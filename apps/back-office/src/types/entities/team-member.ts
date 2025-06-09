/**
 * @deprecated Use SafeUser or SafeUserWithRelations from @mcw/types instead
 * TODO: [TYPE-MIGRATION] Move to @mcw/types/entities/user
 * TODO: [TYPE-MIGRATION-CASING] Keep snake_case, create separate UserUI type for components
 */
export interface BaseTeamMember {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  profile_photo?: string;
  date_of_birth?: string;
  last_login?: string;
}

/**
 * @deprecated Move to @mcw/types/entities/role
 * TODO: [TYPE-MIGRATION] This should be shared across apps
 */
export interface TeamMemberRole {
  id: string;
  name: string;
  permissions?: string[];
}

/**
 * @deprecated Use SafeUserWithRelations from @mcw/types instead
 * TODO: [TYPE-MIGRATION] Remove and use the existing shared type
 * TODO: [TYPE-MIGRATION-CASING] Keep snake_case, create separate UI type with camelCase
 */
export interface TeamMemberWithRole extends BaseTeamMember {
  UserRole?: Array<{
    user_id: string;
    role_id: string;
    Role: TeamMemberRole;
  }>;
  Clinician?: ClinicianInfo | null;
}

/**
 * @deprecated Move to @mcw/types/entities/clinician
 * TODO: [TYPE-MIGRATION] Create SafeClinician type in shared types
 * TODO: [TYPE-MIGRATION-CASING] Keep snake_case, create ClinicianUI type for components
 */
export interface ClinicianInfo {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  address: string;
  percentage_split: number;
  is_active: boolean;
  speciality?: string;
  NPI_number?: string;
  taxonomy_code?: string;
}

export interface LicenseInfo {
  id?: string;
  type: string;
  number: string;
  expirationDate: string;
  state: string;
  isActive?: boolean;
}

export interface TeamMemberFormData {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  role?: string;
  roleIds?: string[];
  specialty?: string;
  npiNumber?: string;
  taxonomyCode?: string;
  address?: string;
  percentageSplit?: number;
  isClinician?: boolean;
  isActive?: boolean;
  services?: string[];
  license?: LicenseInfo;
  clinicianInfo?: {
    address: string;
    percentageSplit: number;
    specialty?: string;
    npiNumber?: string;
    taxonomyCode?: string;
  };
}

export interface TeamMemberCreateRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  roleIds: string[];
  isClinician: boolean;
  clinicianInfo?: {
    address: string;
    percentageSplit: number;
    specialty?: string;
    npiNumber?: string;
    taxonomyCode?: string;
  };
}

export interface TeamMemberUpdateRequest {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  roleIds?: string[];
  isClinician?: boolean;
  clinicianInfo?: {
    address?: string;
    percentageSplit?: number;
    specialty?: string;
    npiNumber?: string;
    taxonomyCode?: string;
  };
}
