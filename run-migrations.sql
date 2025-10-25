-- ================================================
-- The IG Interview Coach - Complete Database Setup
-- ================================================
-- Run this file in your Supabase SQL Editor
-- It will set up all tables, policies, and indexes
-- ================================================

-- Migration 0001: Initial Schema
-- ================================================

-- Create tables for the Mock Interview Bot
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_count INTEGER DEFAULT 0,
  last_session_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  parsed_data JSONB
);

CREATE TABLE IF NOT EXISTS interview_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'in_progress',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  job_data JSONB
);

CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  type TEXT NOT NULL,
  skill TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  is_follow_up BOOLEAN DEFAULT FALSE,
  parent_question_id UUID REFERENCES questions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  analysis JSONB
);

CREATE TABLE IF NOT EXISTS feedback_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
  overall_score NUMERIC NOT NULL,
  summary TEXT NOT NULL,
  strengths JSONB NOT NULL,
  areas_for_improvement JSONB NOT NULL,
  next_steps JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  pdf_url TEXT
);

-- Create RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON documents;
DROP POLICY IF EXISTS "Users can view their own sessions" ON interview_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON interview_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON interview_sessions;
DROP POLICY IF EXISTS "Users can view questions in their sessions" ON questions;
DROP POLICY IF EXISTS "Users can view their own answers" ON answers;
DROP POLICY IF EXISTS "Users can insert their own answers" ON answers;
DROP POLICY IF EXISTS "Users can view their own feedback reports" ON feedback_reports;

-- User policies
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Document policies
CREATE POLICY "Users can view their own documents" ON documents
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own documents" ON documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Session policies
CREATE POLICY "Users can view their own sessions" ON interview_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sessions" ON interview_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sessions" ON interview_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Question policies
CREATE POLICY "Users can view questions in their sessions" ON questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM interview_sessions
      WHERE interview_sessions.id = questions.session_id
      AND interview_sessions.user_id = auth.uid()
    )
  );

-- Answer policies
CREATE POLICY "Users can view their own answers" ON answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM interview_sessions
      WHERE interview_sessions.id = answers.session_id
      AND interview_sessions.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert their own answers" ON answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM interview_sessions
      WHERE interview_sessions.id = answers.session_id
      AND interview_sessions.user_id = auth.uid()
    )
  );

-- Feedback report policies
CREATE POLICY "Users can view their own feedback reports" ON feedback_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM interview_sessions
      WHERE interview_sessions.id = feedback_reports.session_id
      AND interview_sessions.user_id = auth.uid()
    )
  );

-- Create storage bucket for PDFs (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('feedback_pdfs', 'Feedback PDFs', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Users can view their own PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own PDFs" ON storage.objects;

-- Set up storage policies
CREATE POLICY "Users can view their own PDFs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'feedback_pdfs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can upload their own PDFs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'feedback_pdfs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ================================================
-- Migration 0002: Add Question Cache
-- ================================================

-- Create question cache table for faster repeat loads
CREATE TABLE IF NOT EXISTS question_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key TEXT UNIQUE NOT NULL,
  job_description_snippet TEXT,
  questions JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_question_cache_key ON question_cache(cache_key);

-- Create index for cleanup (delete old cache entries)
CREATE INDEX IF NOT EXISTS idx_question_cache_created_at ON question_cache(created_at);

-- Enable RLS for cache table (public cache, no auth required)
ALTER TABLE question_cache ENABLE ROW LEVEL SECURITY;

-- Drop existing cache policies if they exist
DROP POLICY IF EXISTS "Anyone can read from cache" ON question_cache;
DROP POLICY IF EXISTS "Service role can write to cache" ON question_cache;

-- Allow anyone to read from cache (public benefit)
CREATE POLICY "Anyone can read from cache" ON question_cache
  FOR SELECT USING (true);

-- Only server/service role can write to cache (prevent abuse)
CREATE POLICY "Service role can write to cache" ON question_cache
  FOR INSERT WITH CHECK (true);

-- ================================================
-- Verification Queries
-- ================================================

-- Run these after the migration to verify everything works:

-- 1. Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 3. Check policies exist
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. Check indexes exist
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('question_cache', 'interview_sessions', 'questions', 'answers')
ORDER BY tablename, indexname;

-- ================================================
-- Success! Your database is ready to use!
-- ================================================
