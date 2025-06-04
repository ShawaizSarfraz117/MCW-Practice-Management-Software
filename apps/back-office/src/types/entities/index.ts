export * from "./appointment";
export * from "./team-member";

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

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
