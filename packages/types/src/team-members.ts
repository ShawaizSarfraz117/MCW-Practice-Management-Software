// This file contains types that match the database schema exactly
// These types are the source of truth for team member data structures

import type {
  User,
  Role,
  UserRole,
  Clinician,
  License,
  ClinicianServices,
  PracticeService,
  ClinicalInfo,
} from "@prisma/client";

// Role enums matching database values
export enum RoleType {
  ADMIN = "Admin",
  CLINICIAN = "Clinician",
  STAFF = "Staff", // If this exists in your system
}

// Role Categories
export enum RoleCategory {
  CLINICIAN = "CLINICIAN",
  ADMIN = "ADMIN",
}

// Role Subcategories
export enum RoleSubcategory {
  // Clinician subcategories
  BASIC = "BASIC",
  BILLING = "BILLING",
  FULL_CLIENT_LIST = "FULL-CLIENT-LIST",
  ENTIRE_PRACTICE = "ENTIRE-PRACTICE",
  SUPERVISOR = "SUPERVISOR",
  // Admin subcategories
  PRACTICE_MANAGER = "PRACTICE-MANAGER",
  PRACTICE_BILLER = "PRACTICE-BILLER",
}

// Specific role formats (Category.Subcategory)
export enum SpecificRoleType {
  CLINICIAN_BASIC = "CLINICIAN.BASIC",
  CLINICIAN_BILLING = "CLINICIAN.BILLING",
  CLINICIAN_FULL_CLIENT_LIST = "CLINICIAN.FULL-CLIENT-LIST",
  CLINICIAN_ENTIRE_PRACTICE = "CLINICIAN.ENTIRE-PRACTICE",
  CLINICIAN_SUPERVISOR = "CLINICIAN.SUPERVISOR",
  ADMIN_PRACTICE_MANAGER = "ADMIN.PRACTICE-MANAGER",
  ADMIN_PRACTICE_BILLER = "ADMIN.PRACTICE-BILLER",
}

// Map frontend role names to database role names
export const ROLE_NAME_MAP: Record<string, RoleType> = {
  admin: RoleType.ADMIN,
  clinician: RoleType.CLINICIAN,
  staff: RoleType.STAFF,
  // Add uppercase versions for flexibility
  Admin: RoleType.ADMIN,
  Clinician: RoleType.CLINICIAN,
  Staff: RoleType.STAFF,
};

// Map specific roles to base roles
export const SPECIFIC_ROLE_TO_BASE_MAP: Record<string, RoleType> = {
  "CLINICIAN.BASIC": RoleType.CLINICIAN,
  "CLINICIAN.BILLING": RoleType.CLINICIAN,
  "CLINICIAN.FULL-CLIENT-LIST": RoleType.CLINICIAN,
  "CLINICIAN.ENTIRE-PRACTICE": RoleType.CLINICIAN,
  "CLINICIAN.SUPERVISOR": RoleType.CLINICIAN,
  "ADMIN.PRACTICE-MANAGER": RoleType.ADMIN,
  "ADMIN.PRACTICE-BILLER": RoleType.ADMIN,
};

// Helper function to parse role into category and subcategory
export function parseRole(role: string): {
  category: string;
  subcategory: string;
} {
  const parts = role.split(".");
  if (parts.length >= 2) {
    const category = parts[0];
    const subcategory = parts.slice(1).join(".");
    return { category, subcategory };
  }
  return { category: role, subcategory: "" };
}

// User type without sensitive fields
export type SafeUser = Omit<User, "password_hash">;

// UserRole with nested Role
export type UserRoleWithRole = UserRole & {
  Role: Role;
};

// Clinician with services
export type ClinicianServiceWithPracticeService = ClinicianServices & {
  PracticeService: PracticeService;
};

// Clinician with all relations
export type ClinicianWithRelations = Clinician & {
  License?: License[];
  ClinicianServices?: ClinicianServiceWithPracticeService[];
};

// Safe User with all relations
export type SafeUserWithRelations = SafeUser & {
  UserRole: UserRoleWithRole[];
  Clinician: ClinicianWithRelations | null;
  clinicalInfos?: ClinicalInfo[];
};

// Pagination metadata
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// Team members API response type
export type TeamMembersResponse = PaginatedResponse<SafeUserWithRelations>;

// Search params for team members
export type TeamMembersSearchParams = {
  search?: string;
  role?: string;
  page?: number;
  pageSize?: number;
} & Record<string, string | number | boolean | undefined>;
