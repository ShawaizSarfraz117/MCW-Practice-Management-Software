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
 * Common audit event types (max 10 chars due to DB constraint)
 */
export const AuditEventTypes = {
  CLIENT: {
    CREATE: "CL_CREATE",
    UPDATE: "CL_UPDATE",
    DELETE: "CL_DELETE",
    VIEW: "CL_VIEW",
    ARCHIVE: "CL_ARCHIVE",
  },
  USER: {
    CREATE: "US_CREATE",
    UPDATE: "US_UPDATE",
    DELETE: "US_DELETE",
    LOGIN: "US_LOGIN",
    LOGOUT: "US_LOGOUT",
  },
  APPOINTMENT: {
    CREATE: "AP_CREATE",
    UPDATE: "AP_UPDATE",
    DELETE: "AP_DELETE",
    CANCEL: "AP_CANCEL",
    RESCHEDULE: "AP_RESCHED",
    NO_SHOW: "AP_NOSHOW",
    COMPLETE: "AP_COMPLETE",
  },
  NOTE: {
    CREATE: "NOTE_ADD",
    UPDATE: "NOTE_EDIT",
    DELETE: "NOTE_DEL",
    UNLOCK: "NOTE_UNLCK",
  },
  BILLING: {
    INVOICE: "BL_INVOICE",
    PAYMENT: "BL_PAYMENT",
    REFUND: "BL_REFUND",
  },
  DOCUMENT: {
    CREATE: "DOC_CREATE",
    UPDATE: "DOC_UPDATE",
    DELETE: "DOC_DELETE",
    VIEW: "DOC_VIEW",
  },
} as const;
