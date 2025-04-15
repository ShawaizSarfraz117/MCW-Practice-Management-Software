/**
 * Audit log parameter types and constants
 */
export interface CreateAuditLogParams {
  event_type: string;
  event_text: string;
  client_id?: string;
  user_id: string;
  is_hipaa?: boolean;
}

/**
 * Common audit event types
 */
export const AuditEventTypes = {
  CLIENT: {
    CREATE: "CLI_CREATE",
    UPDATE: "CLI_UPDATE",
    DELETE: "CLI_DEL",
    VIEW: "CLI_VIEW",
  },
  USER: {
    CREATE: "USR_CREATE",
    UPDATE: "USR_UPDATE",
    DELETE: "USR_DEL",
    LOGIN: "USR_LOGIN",
    LOGOUT: "USR_OUT",
  },
  APPOINTMENT: {
    CREATE: "APT_CREATE",
    UPDATE: "APT_UPDATE",
    DELETE: "APT_DEL",
    CANCEL: "APT_CANCL",
  },
  DOCUMENT: {
    CREATE: "DOC_CREATE",
    UPDATE: "DOC_UPDATE",
    DELETE: "DOC_DEL",
    VIEW: "DOC_VIEW",
  },
} as const;
