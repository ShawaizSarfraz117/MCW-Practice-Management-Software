// This file contains types that match the database schema exactly
// These types are the source of truth for team member data structures

import type { User, Role, UserRole, Clinician } from "@prisma/client";

// User type without sensitive fields
export type SafeUser = Omit<User, "password_hash">;

// UserRole with nested Role
export type UserRoleWithRole = UserRole & {
  Role: Role;
};

// Safe User with all relations
export type SafeUserWithRelations = SafeUser & {
  UserRole: UserRoleWithRole[];
  Clinician: Clinician | null;
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
