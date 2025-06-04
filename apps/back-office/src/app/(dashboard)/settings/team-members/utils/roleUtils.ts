import { RoleType, ClinicianLevel } from "../hooks/useRolePermissions";

// Clinician role types - Only Clinician and Supervisor
export const CLINICIAN_ROLES: RoleType[] = ["Clinician", "Supervisor"];

// Legacy clinician roles for backward compatibility
export const LEGACY_CLINICIAN_ROLES: RoleType[] = [
  "Clinician with entire practice access",
  "Senior Therapist",
  "Practice Supervisor",
  "Intern/Student",
];

// Administrative role types
export const ADMINISTRATIVE_ROLES: RoleType[] = [
  "Practice Owner",
  "Practice Administrator",
  "Practice Biller",
  "Practice Scheduler",
  "Front Desk Staff",
];

// Clinician levels
export const CLINICIAN_LEVELS: ClinicianLevel[] = [
  "Basic",
  "Billing",
  "Full client list",
  "Entire practice",
];

/**
 * Determines if any of the selected roles is a clinician role
 * @param roles The roles to check (string or array of strings)
 * @returns boolean indicating if any of the roles is a clinician role
 */
export const hasClinicianRole = (
  roles?: string | string[] | null | undefined,
): boolean => {
  if (!roles) return false;

  // If not an array and not a string, return false
  if (typeof roles !== "string" && !Array.isArray(roles)) return false;

  // Handle both single role (string) and multiple roles (array)
  const roleArray = Array.isArray(roles) ? roles : [roles];

  // Check if any of the roles is a clinician role (including legacy roles)
  return roleArray.some(
    (role) =>
      CLINICIAN_ROLES.includes(role as RoleType) ||
      LEGACY_CLINICIAN_ROLES.includes(role as RoleType),
  );
};

/**
 * Determines if the provided level is a valid clinician level
 * @param level The clinician level to check
 * @returns boolean indicating if the level is valid
 */
export const isValidClinicianLevel = (level?: string): boolean => {
  return level ? CLINICIAN_LEVELS.includes(level as ClinicianLevel) : false;
};

/**
 * Checks if the role is specifically the new "Clinician" role (not Supervisor or legacy roles)
 * @param role The role to check
 * @returns boolean indicating if the role is the "Clinician" role
 */
export const isClinicianWithSubroles = (role?: string): boolean => {
  return role === "Clinician";
};

/**
 * @deprecated Use hasClinicianRole instead
 */
export const isClinicianRole = (role?: string): boolean => {
  return role
    ? CLINICIAN_ROLES.includes(role as RoleType) ||
        LEGACY_CLINICIAN_ROLES.includes(role as RoleType)
    : false;
};
