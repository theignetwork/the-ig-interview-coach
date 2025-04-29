/**
 * Supabase client configuration for the Mock Job Interview Bot
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Initialize admin client for server-side operations
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key';
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Gets the current user session
 * @returns User session or null if not authenticated
 */
export async function getUserSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  } catch (error) {
    console.error('Error getting user session:', error);
    return null;
  }
}

/**
 * Gets the current user
 * @returns User object or null if not authenticated
 */
export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Database schema types
 */

export interface User {
  id: string;
  email: string;
  created_at: string;
  daily_session_count: number;
  last_daily_reset: string;
  is_suspended: boolean;
}

export interface JobDescription {
  id: string;
  user_id: string;
  title: string;
  company: string;
  content: string;
  parsed_data: any;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  storage_path?: string;
  created_at: string;
}

export interface InterviewSession {
  id: string;
  user_id: string;
  job_description_id: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  questions: any[];
  answers: any;
  analyses: any;
  created_at: string;
  completed_at?: string;
}

export interface FeedbackReport {
  id: string;
  session_id: string;
  user_id: string;
  report_data: any;
  overall_score: number;
  pdf_path?: string;
  created_at: string;
}

export interface TokenUsage {
  id: string;
  user_id: string;
  session_id?: string;
  endpoint: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost: number;
  created_at: string;
}

export interface GlobalSetting {
  key: string;
  value: string;
  description: string;
  updated_at: string;
}

export interface AbuseFlag {
  id: string;
  user_id: string;
  flag_type: string;
  flag_details: any;
  created_at: string;
  resolved: boolean;
  resolved_at?: string;
}

/**
 * Database operations
 */

/**
 * Stores a job description in the database
 * @param userId User ID
 * @param title Job title
 * @param company Company name
 * @param content Job description content
 * @param parsedData Parsed job data
 * @param fileInfo Optional file information
 * @returns Created job description
 */
export async function storeJobDescription(
  userId: string,
  title: string,
  company: string,
  content: string,
  parsedData: any,
  fileInfo?: {
    fileName: string;
    fileType: string;
    fileSize: number;
    storagePath: string;
  }
): Promise<JobDescription | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('job_descriptions')
      .insert({
        user_id: userId,
        title,
        company,
        content,
        parsed_data: parsedData,
        file_name: fileInfo?.fileName,
        file_type: fileInfo?.fileType,
        file_size: fileInfo?.fileSize,
        storage_path: fileInfo?.storagePath
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error storing job description:', error);
    return null;
  }
}

/**
 * Creates a new interview session
 * @param userId User ID
 * @param jobDescriptionId Job description ID
 * @param questions Interview questions
 * @returns Created interview session
 */
export async function createInterviewSession(
  userId: string,
  jobDescriptionId: string,
  questions: any[]
): Promise<InterviewSession | null> {
  try {
    // Check session limits
    const { data: limitData, error: limitError } = await supabaseAdmin.rpc(
      'check_session_limits',
      { user_uuid: userId }
    );
    
    if (limitError) throw limitError;
    
    if (!limitData.allowed) {
      throw new Error('Daily session limit reached');
    }
    
    // Create session
    const { data, error } = await supabaseAdmin
      .from('interview_sessions')
      .insert({
        user_id: userId,
        job_description_id: jobDescriptionId,
        status: 'in_progress',
        questions,
        answers: {},
        analyses: {}
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Increment session count
    await supabaseAdmin.rpc(
      'increment_session_count',
      { user_uuid: userId }
    );
    
    return data;
  } catch (error) {
    console.error('Error creating interview session:', error);
    return null;
  }
}

/**
 * Updates an interview session with new answers and analyses
 * @param sessionId Session ID
 * @param questionId Question ID
 * @param answer User's answer
 * @param analysis Answer analysis
 * @returns Updated interview session
 */
export async function updateSessionAnswer(
  sessionId: string,
  questionId: string,
  answer: string,
  analysis: any
): Promise<InterviewSession | null> {
  try {
    // Get current session data
    const { data: currentSession, error: fetchError } = await supabaseAdmin
      .from('interview_sessions')
      .select('answers, analyses')
      .eq('id', sessionId)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Update answers and analyses
    const updatedAnswers = { ...currentSession.answers, [questionId]: answer };
    const updatedAnalyses = { ...currentSession.analyses, [questionId]: analysis };
    
    // Save updates
    const { data, error } = await supabaseAdmin
      .from('interview_sessions')
      .update({
        answers: updatedAnswers,
        analyses: updatedAnalyses
      })
      .eq('id', sessionId)
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error updating session answer:', error);
    return null;
  }
}

/**
 * Completes an interview session
 * @param sessionId Session ID
 * @returns Updated interview session
 */
export async function completeInterviewSession(
  sessionId: string
): Promise<InterviewSession | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('interview_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error completing interview session:', error);
    return null;
  }
}

/**
 * Stores a feedback report
 * @param sessionId Session ID
 * @param userId User ID
 * @param reportData Feedback report data
 * @param overallScore Overall score
 * @param pdfPath Optional path to PDF in storage
 * @returns Created feedback report
 */
export async function storeFeedbackReport(
  sessionId: string,
  userId: string,
  reportData: any,
  overallScore: number,
  pdfPath?: string
): Promise<FeedbackReport | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('feedback_reports')
      .insert({
        session_id: sessionId,
        user_id: userId,
        report_data: reportData,
        overall_score: overallScore,
        pdf_path: pdfPath
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error storing feedback report:', error);
    return null;
  }
}

/**
 * Tracks token usage
 * @param userId User ID
 * @param sessionId Optional session ID
 * @param endpoint API endpoint
 * @param promptTokens Prompt tokens used
 * @param completionTokens Completion tokens used
 * @returns Created token usage record
 */
export async function trackTokenUsage(
  userId: string,
  sessionId: string | null,
  endpoint: string,
  promptTokens: number,
  completionTokens: number
): Promise<TokenUsage | null> {
  try {
    // Calculate cost (approximate rates)
    const promptCost = promptTokens * 0.00001; // $0.01 per 1000 tokens
    const completionCost = completionTokens * 0.00003; // $0.03 per 1000 tokens
    const totalCost = promptCost + completionCost;
    
    const { data, error } = await supabaseAdmin
      .from('token_usage')
      .insert({
        user_id: userId,
        session_id: sessionId,
        endpoint,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
        cost: totalCost
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Check if daily limit is reached
    const { data: limitData, error: limitError } = await supabaseAdmin.rpc(
      'check_token_limit'
    );
    
    if (limitError) throw limitError;
    
    if (limitData && limitData.limit_reached) {
      // Trip circuit breaker
      await supabaseAdmin
        .from('global_settings')
        .update({ value: 'false' })
        .eq('key', 'ALLOW_OPENAI_CALLS');
    }
    
    return data;
  } catch (error) {
    console.error('Error tracking token usage:', error);
    return null;
  }
}

/**
 * Checks if circuit breaker is closed (API calls allowed)
 * @returns Whether API calls are allowed
 */
export async function checkCircuitBreaker(): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('global_settings')
      .select('value')
      .eq('key', 'ALLOW_OPENAI_CALLS')
      .single();
    
    if (error) throw error;
    
    return data.value === 'true';
  } catch (error) {
    console.error('Error checking circuit breaker:', error);
    return false; // Fail closed
  }
}

/**
 * Storage operations
 */

/**
 * Uploads a file to Supabase Storage
 * @param bucket Storage bucket
 * @param path File path in storage
 * @param file File to upload
 * @returns Public URL of the uploaded file
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    
    // Get public URL
    const { data: urlData } = supabaseAdmin
      .storage
      .from(bucket)
      .getPublicUrl(data.path);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
}

/**
 * Uploads a PDF buffer to Supabase Storage
 * @param bucket Storage bucket
 * @param path File path in storage
 * @param pdfBuffer PDF buffer
 * @returns Public URL of the uploaded PDF
 */
export async function uploadPDF(
  bucket: string,
  path: string,
  pdfBuffer: Buffer
): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .storage
      .from(bucket)
      .upload(path, pdfBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    
    // Get public URL
    const { data: urlData } = supabaseAdmin
      .storage
      .from(bucket)
      .getPublicUrl(data.path);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading PDF:', error);
    return null;
  }
}

/**
 * Gets a file from Supabase Storage
 * @param bucket Storage bucket
 * @param path File path in storage
 * @returns File data
 */
export async function getFile(
  bucket: string,
  path: string
): Promise<Blob | null> {
  try {
    const { data, error } = await supabaseAdmin
      .storage
      .from(bucket)
      .download(path);
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error getting file:', error);
    return null;
  }
}
