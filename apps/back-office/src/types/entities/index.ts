export * from "./appointment";
export * from "./team-member";

/**
 * @deprecated Use PaginatedResponse from @mcw/types instead
 * TODO: [TYPE-MIGRATION-DUPLICATE] Remove this type and import from @mcw/types
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * @deprecated Use ApiResponse from @mcw/types instead
 * TODO: [TYPE-MIGRATION-DUPLICATE] Remove this type and import from @mcw/types
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success?: boolean;
  message?: string;
}

export interface FormState<T> {
  data: T;
  errors: Record<string, string>;
  isLoading: boolean;
  isValid: boolean;
}
