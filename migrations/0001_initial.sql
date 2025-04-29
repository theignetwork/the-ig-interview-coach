-- Create tables for the Mock Interview Bot
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_count INTEGER DEFAULT 0,
  last_session_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE documents (
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

CREATE TABLE interview_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'in_progress',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  job_data JSONB
);

CREATE TABLE questions (
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

CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  analysis JSONB
);

CREATE TABLE feedback_reports (
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

-- Create storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('feedback_pdfs', 'Feedback PDFs', false);

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
