// Appointment-related types and enums

export enum AppointmentType {
  APPOINTMENT = "APPOINTMENT",
  EVENT = "EVENT",
}

export enum AppointmentStatus {
  SCHEDULED = "SCHEDULED",
  CONFIRMED = "CONFIRMED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW",
}

// Re-export for backward compatibility
export type AppointmentTypeValue = keyof typeof AppointmentType;
export type AppointmentStatusValue = keyof typeof AppointmentStatus;
