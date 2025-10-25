# Session 3: Interview Coach Integration - Receive Oracle PRO Sessions

## Objective
Add new `/practice` route to Interview Coach that loads questions from Oracle PRO prep sessions, while maintaining full backward compatibility with existing interview flow.

## Context
- Session 1: Supabase table exists ✅
- Session 2: Oracle PRO can save sessions and redirect ✅
- Interview Coach already uses Supabase ✅
- Interview Coach must continue working standalone ✅

## Requirements

### Critical Rules
1. ✅ Existing interview flow must work unchanged
2. ✅ Users can still paste job descriptions directly
3. ✅ `/practice` route is OPTIONAL entry point
4. ✅ If Oracle session not found, fall back to normal flow
5. ✅ Show clear indication when using Oracle questions

## File Changes Overview

```
interview-coach/
└── src/
    └── app/
        ├── practice/
        │   ├── page.tsx         (CREATE - new route)
        │   ├── loading.tsx      (CREATE - loading state)
        │   └── error.tsx        (CREATE - error handling)
        ├── interview/
        │   └── page.tsx         (MODIFY - add Oracle badge)
        └── feedback/
            └── page.tsx         (MODIFY - add return link)
```

## Tasks

### Task 1: Create Practice Route

**File:** `src/app/practice/page.tsx` (NEW FILE)

**Create this file with the following content:**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { createInterviewSession, saveQuestions } from '@/lib/database/interview-service';

export default function PracticePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const prepSessionId = searchParams.get('prep_session');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Loading prep session...');

  useEffect(() => {
    if (!prepSessionId) {
      // No prep session ID - redirect to normal flow
      router.push('/');
      return;
    }
    
    loadPrepSessionAndStartInterview();
  }, [prepSessionId, router]);

  async function loadPrepSessionAndStartInterview() {
    try {
      setStatus('Loading your questions from Oracle PRO...');

      // 1. Get Oracle prep session from Supabase
      const { data: prepSession, error: prepError } = await supabase
        .from('oracle_prep_sessions')
        .select('*')
        .eq('id', prepSessionId)
        .single();

      if (prepError) {
        console.error('Error loading prep session:', prepError);
        throw new Error('Could not load prep session');
      }

      if (!prepSession) {
        throw new Error('Prep session not found');
      }

      console.log('✅ Loaded prep session:', prepSession.id);

      setStatus('Creating your interview session...');

      // 2. Create Interview Coach session
      const interviewSession = await createInterviewSession({
        job_description: prepSession.job_description,
        job_title: prepSession.job_title || 'Practice Interview',
        company: prepSession.company_name || undefined
      });

      if (!interviewSession) {
        throw new Error('Failed to create interview session');
      }

      console.log('✅ Created interview session:', interviewSession.id);

      setStatus('Saving your questions...');

      // 3. Save Oracle questions to Interview Coach database
      const questionsToSave = prepSession.questions.map((q: any, index: number) => ({
        session_id: interviewSession.id,
        text: q.text,
        type: q.category?.toLowerCase() || 'behavioral',
        skill: q.category || 'General',
        difficulty: q.difficulty?.toLowerCase() || 'medium',
        order_index: index,
        is_follow_up: false
      }));

      const savedQuestions = await saveQuestions(questionsToSave);

      if (!savedQuestions || savedQuestions.length === 0) {
        throw new Error('Failed to save questions');
      }

      console.log('✅ Saved questions:', savedQuestions.length);

      // 4. Link prep session to interview session
      const { error: updateError } = await supabase
        .from('oracle_prep_sessions')
        .update({
          interview_coach_session_id: interviewSession.id,
          status: 'practicing',
          practiced_at: new Date().toISOString()
        })
        .eq('id', prepSessionId);

      if (updateError) {
        console.warn('Warning: Could not link sessions:', updateError);
        // Non-critical error, continue anyway
      }

      setStatus('Starting your practice interview...');

      // 5. Redirect to interview with special flag
      setTimeout(() => {
        router.push(`/interview?session=${interviewSession.id}&from=oracle`);
      }, 500);

    } catch (err) {
      console.error('Error in practice flow:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setLoading(false);

      // After 3 seconds, redirect to normal flow
      setTimeout(() => {
        router.push('/');
      }, 3000);
    }
  }

  if (loading && !error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center max-w-md px-6">
          {/* Loading Spinner */}
          <div className="mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          </div>

          {/* Oracle PRO Badge */}
          <div className="mb-4">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-teal-100 text-teal-700 rounded-full text-sm font-medium">
              <span className="text-xl">🔮</span>
              From Oracle PRO
            </span>
          </div>

          {/* Status Message */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Preparing Your Practice Session
          </h2>
          <p className="text-gray-600 mb-4">
            {status}
          </p>

          {/* Progress Indicator */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="bg-blue-600 h-2 rounded-full animate-progress"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center max-w-md px-6">
          {/* Error Icon */}
          <div className="text-red-600 text-6xl mb-4">⚠️</div>

          {/* Error Message */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Could Not Load Practice Session
          </h2>
          <p className="text-gray-600 mb-6">
            {error}
          </p>

          {/* Helpful Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              Don't worry! You'll be redirected to start a fresh interview in a moment...
            </p>
          </div>

          {/* Manual Actions */}
          <div className="space-y-3">
            <a 
              href="/"
              className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Start Fresh Interview Now
            </a>
            <a 
              href="https://oracle-pro.theinterviewguys.com" 
              className="block w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
            >
              ← Return to Oracle PRO
            </a>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
```

---

### Task 2: Add Progress Animation CSS

**File:** `src/app/globals.css`

**Add this CSS at the end:**

```css
@keyframes progress {
  0% {
    width: 0%;
  }
  50% {
    width: 70%;
  }
  100% {
    width: 100%;
  }
}

.animate-progress {
  animation: progress 2s ease-in-out infinite;
}
```

---

### Task 3: Create Loading Component

**File:** `src/app/practice/loading.tsx` (NEW FILE)

```typescript
export default function PracticeLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="text-center max-w-md px-6">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">Loading practice session...</p>
      </div>
    </div>
  );
}
```

---

### Task 4: Create Error Boundary

**File:** `src/app/practice/error.tsx` (NEW FILE)

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PracticeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Practice page error:', error);
    
    // Auto-redirect after 3 seconds
    const timeout = setTimeout(() => {
      router.push('/');
    }, 3000);

    return () => clearTimeout(timeout);
  }, [error, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      <div className="text-center max-w-md px-6">
        <div className="text-red-600 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Something Went Wrong
        </h2>
        <p className="text-gray-600 mb-6">
          We couldn't load your practice session. 
          Redirecting you to start a fresh interview...
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
}
```

---

### Task 5: Update Interview Page - Add Oracle Badge

**File:** `src/app/interview/page.tsx`

**Location:** Near the top of the main component, after getting searchParams

**Find this section:**

```typescript
export default function InterviewPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  // ... existing code
```

**Add this line:**

```typescript
const fromOracle = searchParams.get('from') === 'oracle';
```

**Then find where the interview UI is rendered and add the Oracle badge:**

```typescript
{fromOracle && (
  <div className="mb-6 bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-4 shadow-sm">
    <div className="flex items-start gap-3">
      <span className="text-3xl mt-0.5">🔮</span>
      <div className="flex-1">
        <h3 className="font-semibold text-teal-900 mb-1">
          Practicing Questions from Oracle PRO
        </h3>
        <p className="text-sm text-teal-700 leading-relaxed">
          These questions were prepared in your Oracle PRO session. 
          You'll practice them with our AI interviewer and receive detailed feedback.
        </p>
      </div>
    </div>
  </div>
)}
```

---

### Task 6: Update Feedback Page - Add Return Link

**File:** `src/app/feedback/page.tsx`

**Location:** At the END of the feedback display

**Add this section:**

```typescript
<div className="mt-10 p-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-gray-200">
  <div className="text-center max-w-2xl mx-auto">
    {/* Icon */}
    <div className="mb-4">
      <span className="text-4xl">🎯</span>
    </div>

    {/* Title */}
    <h3 className="text-xl font-bold text-gray-900 mb-2">
      Want to Improve Your Answers?
    </h3>

    {/* Description */}
    <p className="text-gray-600 mb-6">
      Based on this feedback, refine your SOAR answers in Oracle PRO 
      and practice again to see your progress!
    </p>

    {/* Action Buttons */}
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <a 
        href="https://oracle-pro.theinterviewguys.com"
        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-medium shadow-sm"
      >
        <span>←</span>
        <span>Return to Oracle PRO</span>
      </a>
      
      <a 
        href="/dashboard"
        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
      >
        <span>📊</span>
        <span>View Dashboard</span>
      </a>
    </div>
  </div>
</div>
```

---

## Testing Checklist

### Test 1: Existing Flow (Nothing Should Break)
- [ ] Go to home page - works ✅
- [ ] Paste job description - works ✅
- [ ] Start interview normally - works ✅
- [ ] Complete interview - works ✅
- [ ] View feedback - works ✅
- [ ] Dashboard - works ✅

### Test 2: Oracle PRO Integration - Happy Path
- [ ] Navigate to `/practice?prep_session=valid-uuid` ✅
- [ ] Loading screen shows with Oracle PRO badge ✅
- [ ] Questions load from Supabase ✅
- [ ] Redirects to interview page ✅
- [ ] Oracle badge appears in interview ✅
- [ ] Can complete interview normally ✅
- [ ] Feedback page shows return link ✅

### Test 3: Error Handling
- [ ] `/practice` with no prep_session → redirects to home ✅
- [ ] Invalid prep_session ID → shows error, redirects ✅
- [ ] Network error → shows error, redirects ✅

---

## Success Criteria

✅ All existing Interview Coach features work unchanged
✅ New `/practice` route handles Oracle sessions correctly
✅ Questions load from Oracle PRO successfully
✅ Visual indicators show Oracle PRO origin clearly
✅ Error handling is graceful and user-friendly
✅ Users can return to Oracle PRO easily
✅ Normal interview flow still works independently

---

## Rollback Plan

If anything goes wrong:

1. Delete `/practice` folder
2. Remove Oracle badge from interview page
3. Remove return link from feedback page
4. Deploy - app returns to original state

---

**Status:** Ready for implementation
**Estimated Time:** 1-2 hours
**Difficulty:** Easy-Medium
**Risk Level:** Very Low
