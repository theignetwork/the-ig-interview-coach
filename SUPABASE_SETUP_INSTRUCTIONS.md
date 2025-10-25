# Supabase Database Setup Instructions

## Quick Start: Run the Migration

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/snhezroznzsjcqqxpjpp/sql/new
   - Or navigate: Dashboard → SQL Editor → New Query

2. **Copy and run the migration:**
   - Open the file: `run-migrations.sql`
   - Copy ALL contents (Ctrl+A, Ctrl+C)
   - Paste into Supabase SQL Editor
   - Click "Run" button (or press Ctrl+Enter)

3. **Verify success:**
   - You should see: "Success. No rows returned"
   - Scroll down to the verification queries
   - Run them one by one to confirm tables exist

### Option 2: Using Supabase CLI (Advanced)

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref snhezroznzsjcqqxpjpp

# Run migrations
supabase db push
```

---

## What Gets Created

### Tables

1. **users** - User accounts (simple identifier for membership users)
2. **documents** - Uploaded resumes/job descriptions
3. **interview_sessions** - Interview records
4. **questions** - All questions asked during interviews
5. **answers** - User responses to questions
6. **feedback_reports** - AI-generated feedback and scores
7. **question_cache** - Cached questions for faster loads (Phase 1)

### Security

- **Row Level Security (RLS)** enabled on all tables
- **Policies** created to ensure users only see their own data
- **Storage bucket** for PDF reports with secure access

### Indexes

- **Fast lookups** on session_id, user_id, cache_key
- **Efficient queries** for dashboard and history

---

## Verification Steps

After running the migration, verify everything works:

### 1. Check Tables Exist

Run this in SQL Editor:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

You should see:
- answers
- documents
- feedback_reports
- interview_sessions
- question_cache
- questions
- users

### 2. Check RLS is Enabled

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

All tables should have `rowsecurity = true`

### 3. Test Insert (Optional)

```sql
-- Create a test session
INSERT INTO interview_sessions (user_id, status, job_data)
VALUES ('test_user', 'in_progress', '{"description": "Test job"}');

-- Check it was created
SELECT * FROM interview_sessions WHERE user_id = 'test_user';

-- Clean up
DELETE FROM interview_sessions WHERE user_id = 'test_user';
```

---

## Troubleshooting

### Error: "relation already exists"

This means tables already exist. This is fine! The migration uses `CREATE TABLE IF NOT EXISTS` so it won't break anything.

To completely reset (⚠️ WARNING: This deletes all data):
```sql
DROP TABLE IF EXISTS feedback_reports CASCADE;
DROP TABLE IF EXISTS answers CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS interview_sessions CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS question_cache CASCADE;

-- Then run the full migration again
```

### Error: "storage.buckets does not exist"

Your Supabase project might not have storage enabled. You can skip this part - the app will work without PDF storage.

Comment out these lines in the migration:
```sql
-- INSERT INTO storage.buckets ...
-- CREATE POLICY ... ON storage.objects ...
```

### Error: "permission denied"

Make sure you're logged in to Supabase and running queries in the correct project.

---

## Next Steps After Migration

1. ✅ **Migration complete** - Database is ready!
2. 🔧 **Install dependencies** - `npm install @supabase/supabase-js`
3. 🧪 **Test the service layer** - Run test script (see below)
4. 🔄 **Migrate localStorage data** - Import existing interviews
5. 🚀 **Update components** - Replace localStorage calls with DB calls

---

## Testing the Service Layer

Create a test file: `test-db.ts`

```typescript
import {
  createInterviewSession,
  saveQuestion,
  saveAnswer,
  saveFeedbackReport,
  getInterviewById
} from './src/lib/database/interview-service';

async function testDatabase() {
  console.log('🧪 Testing database service...');

  // 1. Create session
  const session = await createInterviewSession({
    job_description: 'Test job description',
    job_title: 'Software Engineer',
    company: 'Test Company'
  });
  console.log('✅ Created session:', session.id);

  // 2. Save question
  const question = await saveQuestion({
    session_id: session.id,
    text: 'Tell me about yourself',
    type: 'behavioral',
    skill: 'communication',
    difficulty: 'easy',
    order_index: 0
  });
  console.log('✅ Saved question:', question.id);

  // 3. Save answer
  const answer = await saveAnswer({
    session_id: session.id,
    question_id: question.id,
    content: 'I am a software engineer with 5 years of experience...'
  });
  console.log('✅ Saved answer:', answer.id);

  // 4. Save report
  const report = await saveFeedbackReport({
    session_id: session.id,
    overall_score: 85,
    summary: 'Great performance!',
    strengths: ['Clear communication', 'Good examples'],
    areas_for_improvement: ['Add more specifics'],
    next_steps: ['Practice STAR method']
  });
  console.log('✅ Saved report:', report.id);

  // 5. Retrieve everything
  const interview = await getInterviewById(session.id);
  console.log('✅ Retrieved interview:', interview);

  console.log('🎉 All tests passed!');
}

testDatabase().catch(console.error);
```

Run it:
```bash
npx tsx test-db.ts
```

---

## Environment Variables

Make sure these are set in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://snhezroznzsjcqqxpjpp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

Also add to Netlify environment variables!

---

## Database Schema Diagram

```
users
  ├── interview_sessions
  │     ├── questions
  │     │     └── answers
  │     └── feedback_reports
  └── documents

question_cache (standalone, for caching)
```

---

## Support

If you run into issues:
1. Check the [Supabase docs](https://supabase.com/docs)
2. View logs in Supabase Dashboard → Logs
3. Test queries in SQL Editor
4. Check this project's console logs

---

## Summary

✅ **What you should have after this:**
- All database tables created
- RLS policies enabled
- Indexes for fast queries
- Storage bucket for PDFs
- Ready to replace localStorage with database

✅ **Time to complete:** 5-10 minutes
✅ **Difficulty:** Easy (just copy/paste SQL)
✅ **Risk:** Zero (won't affect existing app)

🚀 **Ready to proceed with Phase 2!**
