// Activity template structure
export interface ActivityTemplate {
  entityType: string;
  action: string;
  template: string;
  isHipaa?: boolean;
}

// Activity log entry
export interface ActivityLogEntry {
  entityType: string;
  entityId?: string;
  action: string;
  context?: Record<string, unknown>;
  userId?: string;
  clientId?: string;
  clientGroupId?: string;
}

// Entity lookup result
export interface EntityLookupResult {
  [key: string]: string | number | Date | undefined;
}

// Activity templates for different actions
export const ACTIVITY_TEMPLATES: Record<string, ActivityTemplate> = {
  // Appointment activities
  APPOINTMENT_CREATED: {
    entityType: "APPOINTMENT",
    action: "created",
    template:
      "You created an appointment on {date} at {time} for {clientGroup}",
    isHipaa: true,
  },
  APPOINTMENT_UPDATED: {
    entityType: "APPOINTMENT",
    action: "updated",
    template: "Updated appointment {changes}",
    isHipaa: true,
  },
  APPOINTMENT_CANCELLED: {
    entityType: "APPOINTMENT",
    action: "cancelled",
    template: "Cancelled appointment with {clientGroup} scheduled for {date}",
    isHipaa: true,
  },
  APPOINTMENT_STATUS_CHANGED: {
    entityType: "APPOINTMENT",
    action: "status_changed",
    template: "Changed appointment status to {status} for {clientGroup}",
    isHipaa: true,
  },

  // Event activities
  EVENT_CREATED: {
    entityType: "EVENT",
    action: "created",
    template: "Created event '{title}' on {date} at {time}",
  },
  EVENT_UPDATED: {
    entityType: "EVENT",
    action: "updated",
    template: "Updated event '{title}'",
  },
  EVENT_CANCELLED: {
    entityType: "EVENT",
    action: "cancelled",
    template: "Cancelled event '{title}' scheduled for {date}",
  },

  // Client activities
  CLIENT_CREATED: {
    entityType: "CLIENT",
    action: "created",
    template: "Created new client: {clientName}",
    isHipaa: true,
  },
  CLIENT_UPDATED: {
    entityType: "CLIENT",
    action: "updated",
    template: "Updated client {clientName} information",
    isHipaa: true,
  },
  CLIENT_ARCHIVED: {
    entityType: "CLIENT",
    action: "archived",
    template: "Archived client {clientName}",
    isHipaa: true,
  },

  // Team member activities
  TEAM_MEMBER_CREATED: {
    entityType: "TEAM",
    action: "created",
    template: "Added new team member: {teamMember} as {role}",
  },
  TEAM_MEMBER_UPDATED: {
    entityType: "TEAM",
    action: "updated",
    template: "Updated team member {teamMember} information",
  },
  TEAM_MEMBER_DEACTIVATED: {
    entityType: "TEAM",
    action: "deactivated",
    template: "Deactivated team member {teamMember}",
  },

  // Payment activities
  PAYMENT_PROCESSED: {
    entityType: "PAYMENT",
    action: "processed",
    template: "Processed payment of ${amount} for {clientGroup}",
    isHipaa: true,
  },
  PAYMENT_REFUNDED: {
    entityType: "PAYMENT",
    action: "refunded",
    template: "Refunded ${amount} to {clientGroup}",
    isHipaa: true,
  },
  PAYMENT_FAILED: {
    entityType: "PAYMENT",
    action: "failed",
    template: "Payment of ${amount} failed for {clientGroup}",
    isHipaa: true,
  },

  // Invoice activities
  INVOICE_CREATED: {
    entityType: "INVOICE",
    action: "created",
    template: "Created invoice #{invoiceNumber} for {clientGroup} - ${amount}",
    isHipaa: true,
  },
  INVOICE_SENT: {
    entityType: "INVOICE",
    action: "sent",
    template: "Sent invoice #{invoiceNumber} to {clientGroup}",
    isHipaa: true,
  },
  INVOICE_PAID: {
    entityType: "INVOICE",
    action: "paid",
    template: "Invoice #{invoiceNumber} paid in full by {clientGroup}",
    isHipaa: true,
  },
  INVOICE_VOIDED: {
    entityType: "INVOICE",
    action: "voided",
    template: "Voided invoice #{invoiceNumber} for {clientGroup}",
    isHipaa: true,
  },

  // Service activities
  SERVICE_CREATED: {
    entityType: "SERVICE",
    action: "created",
    template: "Created new service: {serviceName} ({code})",
  },
  SERVICE_UPDATED: {
    entityType: "SERVICE",
    action: "updated",
    template: "Updated service {serviceName}",
  },
  SERVICE_DEACTIVATED: {
    entityType: "SERVICE",
    action: "deactivated",
    template: "Deactivated service {serviceName}",
  },

  // Location activities
  LOCATION_CREATED: {
    entityType: "LOCATION",
    action: "created",
    template: "Created new location: {locationName}",
  },
  LOCATION_UPDATED: {
    entityType: "LOCATION",
    action: "updated",
    template: "Updated location {locationName}",
  },
  LOCATION_DEACTIVATED: {
    entityType: "LOCATION",
    action: "deactivated",
    template: "Deactivated location {locationName}",
  },

  // License activities
  LICENSE_ADDED: {
    entityType: "LICENSE",
    action: "added",
    template: "Added license for {clinician} in {state}",
  },
  LICENSE_UPDATED: {
    entityType: "LICENSE",
    action: "updated",
    template: "Updated license for {clinician}",
  },
  LICENSE_EXPIRED: {
    entityType: "LICENSE",
    action: "expired",
    template: "License expired for {clinician} in {state}",
  },

  // Availability activities
  AVAILABILITY_CREATED: {
    entityType: "AVAILABILITY",
    action: "created",
    template: "Created availability for {clinician} at {location}",
  },
  AVAILABILITY_UPDATED: {
    entityType: "AVAILABILITY",
    action: "updated",
    template: "Updated availability for {clinician}",
  },
  AVAILABILITY_DELETED: {
    entityType: "AVAILABILITY",
    action: "deleted",
    template: "Deleted availability for {clinician}",
  },

  // Note activities
  NOTE_CREATED: {
    entityType: "NOTE",
    action: "created",
    template: "Created {noteType} for appointment with {clientGroup}",
    isHipaa: true,
  },
  NOTE_UPDATED: {
    entityType: "NOTE",
    action: "updated",
    template: "Updated {noteType} for {clientGroup}",
    isHipaa: true,
  },
  NOTE_SIGNED: {
    entityType: "NOTE",
    action: "signed",
    template: "Signed {noteType} for {clientGroup}",
    isHipaa: true,
  },

  // Portal activities
  PORTAL_INVITATION_SENT: {
    entityType: "PORTAL",
    action: "invitation_sent",
    template: "Sent portal invitation to {clientName}",
  },
  PORTAL_ACTIVATED: {
    entityType: "PORTAL",
    action: "activated",
    template: "Portal activated by {clientName}",
  },
  PORTAL_LOGIN: {
    entityType: "PORTAL",
    action: "login",
    template: "Portal login by {clientName}",
  },

  // Survey activities
  SURVEY_ASSIGNED: {
    entityType: "SURVEY",
    action: "assigned",
    template: "Assigned {surveyType} to {clientName}",
  },
  SURVEY_COMPLETED: {
    entityType: "SURVEY",
    action: "completed",
    template: "{clientName} completed {surveyType}",
  },

  // Statement activities
  STATEMENT_GENERATED: {
    entityType: "STATEMENT",
    action: "generated",
    template: "Generated statement for {clientGroup} - Balance: ${balance}",
    isHipaa: true,
  },
  STATEMENT_SENT: {
    entityType: "STATEMENT",
    action: "sent",
    template: "Sent statement to {clientGroup}",
    isHipaa: true,
  },

  // Superbill activities
  SUPERBILL_GENERATED: {
    entityType: "SUPERBILL",
    action: "generated",
    template: "Generated superbill for {clientGroup}",
    isHipaa: true,
  },
  SUPERBILL_SENT: {
    entityType: "SUPERBILL",
    action: "sent",
    template: "Sent superbill to {clientGroup}",
    isHipaa: true,
  },

  // Generic activities for edge cases
  GENERIC_CREATE: {
    entityType: "GENERIC",
    action: "created",
    template: "Created {entityName}",
  },
  GENERIC_UPDATE: {
    entityType: "GENERIC",
    action: "updated",
    template: "Updated {entityName}",
  },
  GENERIC_DELETE: {
    entityType: "GENERIC",
    action: "deleted",
    template: "Deleted {entityName}",
  },
};
