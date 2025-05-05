// back-office/src/types/auditTypes.ts

import { Audit } from "@prisma/client";

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

export interface AuditWithRelations extends Audit {
  Client?: {
    legal_first_name: string | null;
    legal_last_name: string | null;
  };
  User?: {
    email: string;
  };
}

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

export interface ActivityResponse {
  data: TransformedAudit[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
