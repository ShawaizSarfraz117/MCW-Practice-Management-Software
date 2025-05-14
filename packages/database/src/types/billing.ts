export interface BillingSettings {
  id: string;
  clinician_id: string;
  autoInvoiceCreation: string;
  pastDueDays: number;
  emailClientPastDue: boolean;
  invoiceIncludePracticeLogo: boolean;
  invoiceFooterInfo: string | null;
  superbillDayOfMonth: number;
  superbillIncludePracticeLogo: boolean;
  superbillIncludeSignatureLine: boolean;
  superbillIncludeDiagnosisDescription: boolean;
  superbillFooterInfo: string | null;
  billingDocEmailDelayMinutes: number;
  createMonthlyStatementsForNewClients: boolean;
  createMonthlySuperbillsForNewClients: boolean;
  defaultNotificationMethod: string;
  created_at: Date;
  updated_at: Date;
}
