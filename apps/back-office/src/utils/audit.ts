import { z } from "zod";
import { prisma } from "@mcw/database";

/**
 * Zod schema for validating audit log requests
 */
export const auditSchema = z.object({
  event_type: z.string().min(1),
  event_text: z.string().min(1),
  client_id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  is_hipaa: z.boolean().optional().default(false),
});

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
 * Creates an audit log entry in the database
 */
export async function createAuditLog(params: CreateAuditLogParams) {
  return prisma.audit.create({
    data: {
      event_type: params.event_type,
      event_text: params.event_text,
      client_id: params.client_id,
      user_id: params.user_id,
      is_hipaa: params.is_hipaa ?? false,
    },
  });
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
