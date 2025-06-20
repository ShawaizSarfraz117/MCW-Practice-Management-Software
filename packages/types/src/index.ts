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

// Re-export team member types
export * from "./team-members";

// Re-export calendar types
export * from "./calendar";

// Re-export file sharing types
export * from "./fileSharing";

// Re-export client types
export * from "./client";

// Re-export appointment types
export * from "./appointment";

// Re-export client files types
export * from "./clientFiles";

// Re-export client overview types
export * from "./client-overview";
