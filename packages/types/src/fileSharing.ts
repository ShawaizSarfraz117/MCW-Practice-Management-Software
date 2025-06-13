export const FILE_FREQUENCY_OPTIONS = {
  ONCE: "once",
  AFTER_EVERY_APPOINTMENT: "after_every_appointment",
  BEFORE_EVERY_APPOINTMENT: "before_every_appointment",
  BEFORE_EVERY_OTHER_APPOINTMENT: "before_every_other_appointment",
  EVERY_2_WEEKS: "every_2_weeks",
  EVERY_4_WEEKS: "every_4_weeks",
} as const;

export type FileFrequency =
  (typeof FILE_FREQUENCY_OPTIONS)[keyof typeof FILE_FREQUENCY_OPTIONS];

export const FILE_FREQUENCY_LABELS: Record<FileFrequency, string> = {
  [FILE_FREQUENCY_OPTIONS.ONCE]: "Once",
  [FILE_FREQUENCY_OPTIONS.AFTER_EVERY_APPOINTMENT]: "After every appointment",
  [FILE_FREQUENCY_OPTIONS.BEFORE_EVERY_APPOINTMENT]: "Before every appointment",
  [FILE_FREQUENCY_OPTIONS.BEFORE_EVERY_OTHER_APPOINTMENT]:
    "Before every other appointment",
  [FILE_FREQUENCY_OPTIONS.EVERY_2_WEEKS]: "Every 2 weeks",
  [FILE_FREQUENCY_OPTIONS.EVERY_4_WEEKS]: "Every 4 weeks",
};

export interface SharedFileRequest {
  client_group_id: string;
  clients: Array<{
    client_id: string;
    survey_template_ids?: string[];
    file_ids?: string[];
    frequencies?: Record<string, FileFrequency>;
  }>;
}

export interface UploadedFile {
  id: string;
  title: string;
  url: string;
  uploadedAt: Date;
  uploadedBy?: string;
  isShared: boolean;
  sharedAt?: Date;
  frequency?: FileFrequency;
}

export interface ClientFileWithFrequency {
  id: string;
  client_group_file_id: string;
  client_id: string;
  status: string;
  frequency?: FileFrequency | null;
  next_due_date?: Date | null;
  shared_at?: Date | null;
  completed_at?: Date | null;
}

export interface DocumentItem {
  id: string;
  label: string;
  checked: boolean;
  frequency: boolean;
  isTemplate: boolean;
  sharedOn?: string | Date;
  status?: string;
  isShared?: boolean;
}

export interface DocumentCategories {
  consentDocuments: DocumentItem[];
  scoredMeasures: DocumentItem[];
  questionnaires: DocumentItem[];
  uploadedFiles: DocumentItem[];
}
