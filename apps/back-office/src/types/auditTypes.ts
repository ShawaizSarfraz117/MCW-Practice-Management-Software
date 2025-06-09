// back-office/src/types/auditTypes.ts

/**
 * TODO: [TYPE-MIGRATION] Change to import from @mcw/database
 */
import { Audit } from "@prisma/client";

/**
 * @deprecated Don't extend Prisma types directly
 * TODO: [TYPE-MIGRATION] Create SafeAudit type in @mcw/types
 * TODO: [TYPE-MIGRATION-CASING] Keep snake_case, create AuditUI type for components
 */
export interface TransformedAudit extends Omit<Audit, "Id"> {
  id: string;
  Client?: {
    legal_first_name: string | null;
    legal_last_name: string | null;
  };
  User?: {
    email: string;
  };
}

/**
 * @deprecated Don't extend Prisma types directly
 * TODO: [TYPE-MIGRATION] Create SafeAuditWithRelations in @mcw/types
 * TODO: [TYPE-MIGRATION-CASING] Keep snake_case, create AuditWithRelationsUI type
 */
export interface AuditWithRelations extends Audit {
  Client?: {
    legal_first_name: string | null;
    legal_last_name: string | null;
  };
  User?: {
    email: string;
  };
}

/**
 * @deprecated Move to @mcw/types/entities/audit
 * TODO: [TYPE-MIGRATION] This is a shared type used in API responses
 * TODO: [TYPE-MIGRATION-CASING] Keep snake_case, create ActivityEventUI type
 */
export interface ActivityEvent {
  id: string;
  datetime: string;
  event_text: string;
  event_type: string;
  is_hipaa: boolean;
  Client?: {
    legal_first_name: string;
    legal_last_name: string;
  };
  User?: {
    email: string;
    Clinician?: {
      first_name: string;
      last_name: string;
    };
  };
}

/**
 * @deprecated Use PaginationMeta from @mcw/types instead
 * TODO: [TYPE-MIGRATION-DUPLICATE] Similar to existing pagination types
 */
export interface PaginationData {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ActivityTableProps {
  showDetails: boolean;
  searchQuery: string;
  timeRange: string;
}

/**
 * @deprecated Use PaginatedResponse<TransformedAudit> from @mcw/types
 * TODO: [TYPE-MIGRATION] Replace with generic PaginatedResponse type
 */
export interface ActivityResponse {
  data: TransformedAudit[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
