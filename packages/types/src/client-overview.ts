// Client Overview Document types

export type DocumentType =
  | "appointments"
  | "chart_notes"
  | "diagnosis_and_treatment_plans"
  | "good_faith_estimate"
  | "mental_status_exams"
  | "scored_measures"
  | "questionnaires"
  | "other_documents";

export interface ClientDocument {
  id: string;
  documentType: DocumentType;
  title: string;
  date: string; // ISO string format
  status: string;
  clientName: string;
  clientId: string;
  clientGroupId: string;
  clientGroupName: string;
  content?: string;
}

export interface ClientOverviewResponse {
  data: ClientDocument[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ClientOverviewFilters {
  clientGroupId: string;
  startDate?: string;
  endDate?: string;
  itemType?: DocumentType | "all";
  page?: number;
  limit?: number;
}
