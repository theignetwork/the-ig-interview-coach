-- Add question cache table for faster repeat loads
-- This caches generated questions for 24 hours based on job description

CREATE TABLE IF NOT EXISTS question_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key TEXT UNIQUE NOT NULL,
  job_description_snippet TEXT, -- First 500 chars for reference
  questions JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_question_cache_key ON question_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_question_cache_created_at ON question_cache(created_at);

-- Auto-cleanup old cache entries (older than 7 days)
-- This keeps the table from growing too large
CREATE OR REPLACE FUNCTION cleanup_old_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM question_cache
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Optional: Set up a scheduled job to run cleanup daily
-- (You can set this up in Supabase dashboard under Database > Cron Jobs)
-- SELECT cron.schedule('cleanup-question-cache', '0 2 * * *', 'SELECT cleanup_old_cache();');

-- Add comment for documentation
COMMENT ON TABLE question_cache IS 'Caches AI-generated interview questions for faster repeat loads. Cache entries are valid for 24 hours and automatically cleaned up after 7 days.';
