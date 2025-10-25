# Phase 2: Database Integration Guide

## Overview

This phase migrates The IG Interview Coach from localStorage to Supabase database, enabling:
- ✅ Cross-device access to interviews
- ✅ Persistent data storage (survives browser cache clear)
- ✅ User dashboard with interview history
- ✅ Analytics and progress tracking
- ✅ Better data security with RLS policies

**Estimated Time:** 3-5 days
**Impact:** Better UX, data insights, enables future ML features

---

## Current State vs Target State

### Current (localStorage)
```javascript
// Data saved in browser only
localStorage.setItem('interview_123', JSON.stringify(data));
// Lost when:
// - User clears cache
// - Switches devices
// - Uses different browser
```

### Target (Supabase)
```javascript
// Data saved in cloud database
await supabase.from('interview_sessions').insert(data);
// Available:
// - On any device
// - Forever (until user deletes)
// - With proper security (RLS)
```

---

## Step-by-Step Implementation

### Step 1: Run Database Migrations ✅

1. **Open Supabase Dashboard:**
   - Go to: https://supabase.com/dashboard/project/snhezroznzsjcqqxpjpp
   - Navigate to SQL Editor

2. **Run the migration file:**
   - Open `run-migrations.sql` (in this directory)
   - Copy all contents
   - Paste into Supabase SQL Editor
   - Click "Run"

3. **Verify Success:**
   - You should see "Success. No rows returned" (this is good!)
   - Run the verification queries at the bottom to confirm tables exist

**Tables Created:**
- `users` - User accounts
- `documents` - Uploaded resumes/job descriptions
- `interview_sessions` - Interview records
- `questions` - All questions asked
- `answers` - User responses
- `feedback_reports` - AI-generated feedback
- `question_cache` - Cached questions (from Phase 1)

---

### Step 2: Create Database Service Layer

We'll create a clean abstraction layer so the rest of the app doesn't need to know about database details.

**File:** `src/lib/database/interview-service.ts`

Key functions:
```typescript
// Create new interview session
createInterviewSession(userId, jobDescription, questions)

// Save user answer
saveAnswer(sessionId, questionId, answerText)

// Complete interview and generate report
completeInterview(sessionId, reportData)

// Get user's interview history
getUserInterviews(userId)

// Get specific interview details
getInterviewById(sessionId)
```

---

### Step 3: Add Authentication (Optional but Recommended)

**Without Auth:**
- Use anonymous sessions (no login required)
- Data persists but can't sync across devices
- Good for MVP/testing

**With Auth:**
- Users create accounts (email/password or magic link)
- Data syncs across all devices
- Better security with RLS
- Enable user dashboard

**Recommended:** Start without auth, add later when users request it.

---

### Step 4: Migrate Interview Flow

Update these files to use database instead of localStorage:

#### A. Interview Creation (`src/app/interview/page.tsx`)
```typescript
// OLD: Save to localStorage
localStorage.setItem('pastedJobDescription', jobDescription);

// NEW: Save to database
const { data: session } = await supabase
  .from('interview_sessions')
  .insert({
    user_id: userId, // or null for anonymous
    job_data: { description: jobDescription },
    status: 'in_progress'
  })
  .select()
  .single();
```

#### B. Saving Answers (`src/components/interview/InterviewSession.tsx`)
```typescript
// OLD: Save to localStorage
const answers = [...currentAnswers, newAnswer];
localStorage.setItem(`interview_${sessionId}`, JSON.stringify(answers));

// NEW: Save to database
await supabase.from('answers').insert({
  session_id: sessionId,
  question_id: questionId,
  content: answerText
});
```

#### C. Generating Report (`src/app/feedback/page.tsx`)
```typescript
// OLD: Get from localStorage
const data = localStorage.getItem(`interview_${sessionId}`);

// NEW: Get from database
const { data: session } = await supabase
  .from('interview_sessions')
  .select(`
    *,
    questions (*),
    answers (*),
    feedback_reports (*)
  `)
  .eq('id', sessionId)
  .single();
```

---

### Step 5: Build User Dashboard

Create a new page: `src/app/dashboard/page.tsx`

Features:
- List of all past interviews
- Filter by date, job title, score
- View detailed feedback
- Re-take similar interview
- Download PDF reports
- Track progress over time (chart)

**UI Components:**
```
Dashboard
├── Interview History List
│   ├── Interview Card (date, job title, score)
│   └── Quick actions (view, retake, delete)
├── Progress Chart (scores over time)
├── Statistics Summary
│   ├── Total interviews taken
│   ├── Average score
│   └── Most improved skills
└── Quick Start (new interview button)
```

---

### Step 6: Backward Compatibility

During transition, support both localStorage AND database:

```typescript
// Try database first, fallback to localStorage
async function getInterview(sessionId: string) {
  // Try database
  const { data: dbData } = await supabase
    .from('interview_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (dbData) return dbData;

  // Fallback to localStorage
  const localData = localStorage.getItem(`interview_${sessionId}`);
  if (localData) {
    // Migrate to database
    const parsed = JSON.parse(localData);
    await migrateToDatabase(parsed);
    return parsed;
  }

  throw new Error('Interview not found');
}
```

---

## Implementation Checklist

### Week 1: Database Setup & Service Layer
- [ ] Run migrations in Supabase
- [ ] Create `src/lib/database/` directory
- [ ] Create `interview-service.ts` with all CRUD functions
- [ ] Create `types.ts` for TypeScript interfaces
- [ ] Test service layer functions in isolation

### Week 2: Update Interview Flow
- [ ] Update interview creation to use DB
- [ ] Update question saving to use DB
- [ ] Update answer saving to use DB
- [ ] Update report generation to use DB
- [ ] Add backward compatibility for localStorage
- [ ] Test complete interview flow

### Week 3: Dashboard & Polish
- [ ] Create dashboard page
- [ ] Build interview history component
- [ ] Add progress chart
- [ ] Add statistics summary
- [ ] Test on multiple devices
- [ ] Deploy to production

---

## Testing Plan

1. **Unit Tests:**
   - Test each database service function
   - Mock Supabase client
   - Verify error handling

2. **Integration Tests:**
   - Complete full interview using database
   - Verify data saved correctly
   - Check RLS policies work

3. **Manual Tests:**
   - Take interview on desktop, view on mobile
   - Clear browser cache, verify data persists
   - Test with multiple users (if auth enabled)

---

## Rollback Plan

If something goes wrong:

1. **Keep localStorage code** until database is 100% stable
2. **Feature flag** to switch between storage methods:
   ```typescript
   const USE_DATABASE = process.env.NEXT_PUBLIC_USE_DATABASE === 'true';
   ```
3. **Monitor errors** in production before full migration

---

## Performance Considerations

Database calls are slower than localStorage, so:

1. **Cache aggressively:**
   ```typescript
   // Use React Query or SWR for caching
   const { data } = useQuery('interviews', fetchInterviews, {
     staleTime: 5 * 60 * 1000, // 5 minutes
   });
   ```

2. **Batch operations:**
   ```typescript
   // Instead of 6 separate inserts:
   await supabase.from('answers').insert([
     { session_id, question_id: q1, content: a1 },
     { session_id, question_id: q2, content: a2 },
     // ...
   ]);
   ```

3. **Optimistic updates:**
   ```typescript
   // Update UI immediately, sync in background
   const newAnswer = { id: tempId, content: answer };
   setAnswers([...answers, newAnswer]);

   // Sync to database
   const { data } = await supabase.from('answers').insert(newAnswer);
   setAnswers(answers.map(a => a.id === tempId ? data : a));
   ```

---

## Next Steps

1. **Run the migration** (`run-migrations.sql`)
2. **Review the service layer** code I'll create next
3. **Test in development** with sample data
4. **Gradually migrate** one component at a time
5. **Deploy when stable** with feature flag

---

## Expected Benefits After Phase 2

- ✅ **Better UX:** Users can access interviews from any device
- ✅ **Data persistence:** No more lost interviews
- ✅ **User dashboard:** Track progress over time
- ✅ **Analytics:** Understand user behavior
- ✅ **Future features:** ML recommendations, skill tracking, etc.

**Estimated Time to Complete:** 3-5 days
**Difficulty:** Medium
**Risk:** Low (can rollback to localStorage if needed)
