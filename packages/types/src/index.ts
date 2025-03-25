// Common types used across the application

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "therapist" | "client";
  createdAt: Date;
  updatedAt: Date;
}

// Session types
export interface Session {
  id: string;
  userId: string;
  expires: Date;
  sessionToken: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
