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
