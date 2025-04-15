import { prisma } from "@mcw/database";

export interface CreateAuditLogParams {
  event_type: string;
  event_text: string;
  client_id?: string;
  user_id: string;
  is_hipaa?: boolean;
}

/**
 * Creates an audit log entry in the database
 * @param params The audit log parameters
 * @returns The created audit log entry
 * @throws Error if the audit log creation fails
 */
export async function createAuditLog({
  event_type,
  event_text,
  client_id,
  user_id,
  is_hipaa = false,
}: CreateAuditLogParams) {
  try {
    const audit = await prisma.audit.create({
      data: {
        event_type,
        event_text,
        client_id,
        user_id,
        is_hipaa,
        datetime: new Date(),
      },
    });

    return audit;
  } catch (error) {
    console.error("Error creating audit log:", error);
    throw new Error("Failed to create audit log entry");
  }
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
