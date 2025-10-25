/**
 * Database types for The IG Interview Coach
 * Matches Supabase schema exactly
 */

export interface InterviewSession {
  id: string;
  user_id: string | null;
  document_id: string | null;
  status: 'in_progress' | 'completed' | 'abandoned';
  created_at: string;
  completed_at: string | null;
  job_data: {
    description: string;
    title?: string;
    company?: string;
  };
}

export interface Question {
  id: string;
  session_id: string;
  text: string;
  type: string;
  skill: string;
  difficulty: string;
  order_index: number;
  is_follow_up: boolean;
  parent_question_id: string | null;
  created_at: string;
}

export interface Answer {
  id: string;
  session_id: string;
  question_id: string;
  content: string;
  created_at: string;
  analysis: any | null;
}

export interface FeedbackReport {
  id: string;
  session_id: string;
  overall_score: number;
  summary: string;
  strengths: string[];
  areas_for_improvement: string[];
  next_steps: string[];
  created_at: string;
  pdf_url: string | null;
}

export interface InterviewWithDetails extends InterviewSession {
  questions: Question[];
  answers: Answer[];
  feedback_reports: FeedbackReport[];
}

export interface CreateSessionData {
  user_id?: string | null;
  job_description: string;
  job_title?: string;
  company?: string;
}

export interface SaveAnswerData {
  session_id: string;
  question_id: string;
  content: string;
}

export interface SaveQuestionData {
  session_id: string;
  text: string;
  type: string;
  skill: string;
  difficulty: string;
  order_index: number;
  is_follow_up?: boolean;
  parent_question_id?: string;
}

export interface SaveReportData {
  session_id: string;
  overall_score: number;
  summary: string;
  strengths: string[];
  areas_for_improvement: string[];
  next_steps: string[];
}
