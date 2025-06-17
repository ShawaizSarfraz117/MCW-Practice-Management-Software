import { FileFrequency } from "./fileSharing";

export type FileType =
  | "Measure"
  | "Assessment"
  | "Document"
  | "Consent"
  | "Practice Upload"
  | "Client Upload"
  | "Survey"
  | "Questionnaires";
export type FileStatus =
  | "Pending"
  | "Completed"
  | "Locked"
  | "Scheduled"
  | "Uploaded"
  | "Completed JA"
  | "Shared";

export interface ClientFile {
  id: string;
  name: string;
  type: string; // Changed from FileType to string to allow any type from database
  status: FileStatus;
  statusColor: string;
  updated: string;
  nameColor: string;
  url?: string | null;
  clientGroupFileId: string;
  frequency?: FileFrequency | null;
  nextDueDate?: Date | null;
  surveyAnswersId?: string | null;
  isPracticeUpload?: boolean; // Flag to identify practice uploads vs shared files
  clientName?: string; // Client name for display
  clientInitials?: string; // Client initials to show after status
  clientId?: string; // Client ID for reference
  hasLockedChildren?: boolean; // Flag to indicate if any shared instances are locked
}

export interface ClientFileResponse {
  id: string;
  client_group_file_id: string;
  client_id: string;
  status: string;
  frequency?: FileFrequency | null;
  next_due_date?: Date | string | null;
  shared_at?: Date | string | null;
  completed_at?: Date | string | null;
  survey_answers_id?: string | null;
  blob_url?: string | null;
  ClientGroupFile: {
    id: string;
    title: string;
    type: string;
    url: string | null;
    created_at: Date | string;
    updated_at: Date | string;
    uploaded_by_id: string | null;
    survey_template_id?: string | null;
  };
  SurveyAnswers?: {
    id: string;
    submitted_at?: Date | string | null;
  } | null;
}

export interface ClientFilesResponse {
  success: boolean;
  files: ClientFileResponse[];
}

export const FILE_TYPE_MAPPING: Record<string, FileType> = {
  Consent: "Consent",
  CONSENT: "Consent",
  Measure: "Measure",
  MEASURE: "Measure",
  Assessment: "Assessment",
  ASSESSMENT: "Assessment",
  Document: "Document",
  DOCUMENT: "Document",
  "Practice Upload": "Practice Upload",
  PRACTICE_UPLOAD: "Practice Upload",
  Survey: "Survey",
  SURVEY: "Survey",
  // Survey template types from database
  INTAKE: "Questionnaires",
  CUSTOM: "Document",
  // Template types from app
  scored_measures: "Measure",
  intake_forms: "Questionnaires",
  progress_notes: "Document",
  diagnosis_and_treatment_plans: "Document",
  other_documents: "Document",
  uploaded_files: "Practice Upload",
};

export const FILE_STATUS_COLORS: Record<FileStatus, string> = {
  Pending: "text-orange-600",
  Completed: "text-green-600",
  "Completed JA": "text-green-600",
  Locked: "text-red-600",
  Scheduled: "text-blue-600",
  Uploaded: "text-gray-600",
  Shared: "text-purple-600",
};

// Map template types to ClientGroupFile types for database storage
export const TEMPLATE_TYPE_TO_FILE_TYPE: Record<string, string> = {
  scored_measures: "Measure",
  intake_forms: "Questionnaires",
  progress_notes: "Document",
  diagnosis_and_treatment_plans: "Document",
  other_documents: "Document",
  uploaded_files: "Practice Upload",
};
