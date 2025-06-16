export interface SurveyTemplate {
  id: string;
  name: string;
  type: string;
  description: string | null;
  content: Record<string, unknown> | string | null;
}

export interface Client {
  id: string;
  legal_first_name: string | null;
  legal_last_name: string | null;
  preferred_name: string | null;
  date_of_birth: Date | string | null;
}

export interface Appointment {
  id: string;
  start_date: Date | string;
  end_date: Date | string;
  type: string;
}

export interface SurveyScore {
  totalScore: number;
  severity?: string;
  interpretation?: string;
  flaggedItems?: string[];
}

export interface SurveyAnswerResponse {
  id: string;
  survey_template_id: string;
  client_id: string;
  appointment_id: string | null;
  status: string;
  content: Record<string, string> | null;
  score: SurveyScore | null;
  completed_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
  SurveyTemplate: SurveyTemplate;
  Client: Client;
  Appointment?: Appointment | null;
}

export interface GAD7Question {
  id: number;
  question: string;
  response: string;
  score: string;
  sinceLast: string;
  sinceBaseline: string;
}

export interface GAD7Content {
  gad7_q1?: string;
  gad7_q2?: string;
  gad7_q3?: string;
  gad7_q4?: string;
  gad7_q5?: string;
  gad7_q6?: string;
  gad7_q7?: string;
  gad7_q8?: string;
}
