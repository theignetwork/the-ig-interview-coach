/**
 * Database service layer for interview operations
 * Replaces localStorage with Supabase for persistent storage
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  InterviewSession,
  Question,
  Answer,
  FeedbackReport,
  InterviewWithDetails,
  CreateSessionData,
  SaveAnswerData,
  SaveQuestionData,
  SaveReportData
} from './types';

// Lazy-load Supabase client (created on first use)
let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

    // Use service role key if available (server-side, bypasses RLS)
    // Otherwise use anon key (client-side, enforces RLS)
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const key = serviceKey || anonKey;

    if (!url || !key) {
      throw new Error('Supabase environment variables not set. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
    }

    _supabase = createClient(url, key);
  }
  return _supabase;
}

/**
 * Get or create a user identifier (since we don't have auth)
 * Uses a simple browser-based identifier
 */
export function getUserId(): string | null {
  // In server/test environment, return null (user_id is nullable)
  if (typeof window === 'undefined') return null;

  let userId = localStorage.getItem('ig_user_id');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    localStorage.setItem('ig_user_id', userId);
  }
  return userId;
}

/**
 * Create a new interview session
 */
export async function createInterviewSession(
  data: CreateSessionData
): Promise<InterviewSession> {
  const userId = data.user_id || getUserId();

  const sessionData = {
    user_id: userId,
    status: 'in_progress' as const,
    job_data: {
      description: data.job_description,
      title: data.job_title || 'Custom Role',
      company: data.company || 'Company Name'
    }
  };

  const { data: session, error } = await getSupabase()
    .from('interview_sessions')
    .insert(sessionData)
    .select()
    .single();

  if (error) throw new Error(`Failed to create session: ${error.message}`);
  return session;
}

/**
 * Save a question to the database
 */
export async function saveQuestion(
  data: SaveQuestionData
): Promise<Question> {
  const questionData = {
    session_id: data.session_id,
    text: data.text,
    type: data.type,
    skill: data.skill,
    difficulty: data.difficulty,
    order_index: data.order_index,
    is_follow_up: data.is_follow_up || false,
    parent_question_id: data.parent_question_id || null
  };

  const { data: question, error } = await getSupabase()
    .from('questions')
    .insert(questionData)
    .select()
    .single();

  if (error) throw new Error(`Failed to save question: ${error.message}`);
  return question;
}

/**
 * Save multiple questions at once (more efficient)
 */
export async function saveQuestions(
  questions: SaveQuestionData[]
): Promise<Question[]> {
  const questionData = questions.map(q => ({
    session_id: q.session_id,
    text: q.text,
    type: q.type,
    skill: q.skill,
    difficulty: q.difficulty,
    order_index: q.order_index,
    is_follow_up: q.is_follow_up || false,
    parent_question_id: q.parent_question_id || null
  }));

  const { data, error } = await getSupabase()
    .from('questions')
    .insert(questionData)
    .select();

  if (error) throw new Error(`Failed to save questions: ${error.message}`);
  return data;
}

/**
 * Save an answer to the database
 */
export async function saveAnswer(
  data: SaveAnswerData
): Promise<Answer> {
  const answerData = {
    session_id: data.session_id,
    question_id: data.question_id,
    content: data.content
  };

  const { data: answer, error } = await getSupabase()
    .from('answers')
    .insert(answerData)
    .select()
    .single();

  if (error) throw new Error(`Failed to save answer: ${error.message}`);
  return answer;
}

/**
 * Save a feedback report
 */
export async function saveFeedbackReport(
  data: SaveReportData
): Promise<FeedbackReport> {
  const reportData = {
    session_id: data.session_id,
    overall_score: data.overall_score,
    summary: data.summary,
    strengths: data.strengths,
    areas_for_improvement: data.areas_for_improvement,
    next_steps: data.next_steps
  };

  const { data: report, error } = await getSupabase()
    .from('feedback_reports')
    .insert(reportData)
    .select()
    .single();

  if (error) throw new Error(`Failed to save report: ${error.message}`);
  return report;
}

/**
 * Complete an interview session
 */
export async function completeInterviewSession(
  sessionId: string
): Promise<void> {
  const { error } = await getSupabase()
    .from('interview_sessions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', sessionId);

  if (error) throw new Error(`Failed to complete session: ${error.message}`);
}

/**
 * Get a specific interview session with all details
 */
export async function getInterviewById(
  sessionId: string
): Promise<InterviewWithDetails | null> {
  const { data, error } = await getSupabase()
    .from('interview_sessions')
    .select(`
      *,
      questions (*),
      answers (*),
      feedback_reports (*)
    `)
    .eq('id', sessionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to get interview: ${error.message}`);
  }

  return data;
}

/**
 * Get all interview sessions for a user
 */
export async function getUserInterviews(
  userId?: string | null
): Promise<InterviewWithDetails[]> {
  const uid = userId !== undefined ? userId : getUserId();

  // Build query - handle null user_id properly
  let query = getSupabase()
    .from('interview_sessions')
    .select(`
      *,
      questions (*),
      answers (*),
      feedback_reports (*)
    `);

  if (uid === null) {
    query = query.is('user_id', null);
  } else {
    query = query.eq('user_id', uid);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to get interviews: ${error.message}`);
  return data || [];
}

/**
 * Get recent interview sessions (for dashboard)
 */
export async function getRecentInterviews(
  limit: number = 10
): Promise<InterviewSession[]> {
  const userId = getUserId();

  const { data, error } = await getSupabase()
    .from('interview_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to get recent interviews: ${error.message}`);
  return data || [];
}

/**
 * Delete an interview session (and all related data via CASCADE)
 */
export async function deleteInterview(sessionId: string): Promise<void> {
  const { error } = await getSupabase()
    .from('interview_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) throw new Error(`Failed to delete interview: ${error.message}`);
}

/**
 * Get user statistics
 */
export async function getUserStats(userId?: string | null): Promise<{
  totalInterviews: number;
  averageScore: number;
  completedInterviews: number;
  lastInterviewDate: string | null;
}> {
  const uid = userId !== undefined ? userId : getUserId();

  // Get all sessions - handle null user_id properly
  let query = getSupabase()
    .from('interview_sessions')
    .select('id, status, created_at');

  if (uid === null) {
    query = query.is('user_id', null);
  } else {
    query = query.eq('user_id', uid);
  }

  const { data: sessions, error: sessionsError } = await query;

  if (sessionsError) throw new Error(`Failed to get stats: ${sessionsError.message}`);

  const totalInterviews = sessions?.length || 0;
  const completedInterviews = sessions?.filter(s => s.status === 'completed').length || 0;

  // Get feedback reports for completed interviews
  const sessionIds = sessions?.map(s => s.id) || [];
  const { data: reports, error: reportsError } = await getSupabase()
    .from('feedback_reports')
    .select('overall_score')
    .in('session_id', sessionIds);

  if (reportsError) throw new Error(`Failed to get reports: ${reportsError.message}`);

  const averageScore = reports && reports.length > 0
    ? reports.reduce((sum, r) => sum + r.overall_score, 0) / reports.length
    : 0;

  const lastInterviewDate = sessions && sessions.length > 0
    ? sessions[0].created_at
    : null;

  return {
    totalInterviews,
    averageScore: Math.round(averageScore * 10) / 10,
    completedInterviews,
    lastInterviewDate
  };
}

/**
 * Migrate localStorage data to database
 * Call this once to migrate existing interview data
 */
export async function migrateLocalStorageToDatabase(): Promise<number> {
  if (typeof window === 'undefined') return 0;

  let migratedCount = 0;

  // Find all localStorage keys that start with 'interview_'
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith('interview_')) continue;

    try {
      const data = localStorage.getItem(key);
      if (!data) continue;

      const interviewData = JSON.parse(data);

      // Create session
      const session = await createInterviewSession({
        job_description: interviewData.jobDescription || 'Migrated interview',
        job_title: interviewData.jobTitle,
        company: interviewData.company
      });

      // Save questions and answers
      if (interviewData.questionsAndAnswers) {
        for (let i = 0; i < interviewData.questionsAndAnswers.length; i++) {
          const qa = interviewData.questionsAndAnswers[i];

          // Save question
          const question = await saveQuestion({
            session_id: session.id,
            text: qa.question,
            type: 'behavioral',
            skill: 'general',
            difficulty: 'medium',
            order_index: i
          });

          // Save answer
          if (qa.answer) {
            await saveAnswer({
              session_id: session.id,
              question_id: question.id,
              content: qa.answer
            });
          }
        }
      }

      // Mark as completed (these are historical interviews)
      await completeInterviewSession(session.id);

      migratedCount++;
      console.log(`✅ Migrated interview: ${key}`);
    } catch (error) {
      console.error(`❌ Failed to migrate ${key}:`, error);
    }
  }

  return migratedCount;
}

/**
 * Export all functions for convenience
 */
export default {
  getUserId,
  createInterviewSession,
  saveQuestion,
  saveQuestions,
  saveAnswer,
  saveFeedbackReport,
  completeInterviewSession,
  getInterviewById,
  getUserInterviews,
  getRecentInterviews,
  deleteInterview,
  getUserStats,
  migrateLocalStorageToDatabase
};
