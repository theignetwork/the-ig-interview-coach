# Phase 2: Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Run Database Migration

1. Open: https://supabase.com/dashboard/project/snhezroznzsjcqqxpjpp/sql/new
2. Copy all of `run-migrations.sql`
3. Paste and click "Run"
4. Wait for "Success. No rows returned"

✅ **Done!** Database is ready.

---

### Step 2: Test It Works

```bash
cd "C:\Users\13236\Downloads\IG Network\mock_interview_bot_live"

# Create test file
cat > test.ts << 'EOF'
import { createInterviewSession } from './src/lib/database/interview-service';

createInterviewSession({
  job_description: 'Test job',
  job_title: 'Engineer',
  company: 'Test Co'
}).then(session => {
  console.log('✅ Created session:', session.id);
}).catch(err => {
  console.error('❌ Error:', err.message);
});
EOF

# Run test
npx tsx test.ts
```

See "✅ Created session" → Everything works!

---

## 📝 What We Built

### Files Created:

1. **`run-migrations.sql`**
   - Complete database setup (7 tables + security)
   - Run once in Supabase SQL Editor

2. **`src/lib/database/types.ts`**
   - TypeScript interfaces for all data types

3. **`src/lib/database/interview-service.ts`**
   - All database operations (create, read, update, delete)
   - Replaces localStorage entirely

4. **Documentation:**
   - `PHASE_2_SUMMARY.md` - Complete overview
   - `PHASE_2_DATABASE_MIGRATION.md` - Implementation guide
   - `SUPABASE_SETUP_INSTRUCTIONS.md` - Setup instructions

---

## 🔄 How to Use

### Before (localStorage):
```typescript
// Save interview
localStorage.setItem('interview_123', JSON.stringify(data));

// Get interview
const data = localStorage.getItem('interview_123');
const interview = JSON.parse(data);
```

### After (Database):
```typescript
import {
  createInterviewSession,
  saveAnswer,
  getInterviewById
} from '@/lib/database/interview-service';

// Create interview
const session = await createInterviewSession({
  job_description: 'Senior Engineer at Google',
  job_title: 'Software Engineer',
  company: 'Google'
});

// Save answer
await saveAnswer({
  session_id: session.id,
  question_id: question.id,
  content: 'My answer...'
});

// Get interview
const interview = await getInterviewById(session.id);
```

---

## 🎯 Next Actions

| Priority | Task | Time |
|----------|------|------|
| 🔥 **NOW** | Run `run-migrations.sql` in Supabase | 5 min |
| 🔥 **NOW** | Test with `test.ts` script | 2 min |
| **High** | Update interview creation | 2 hours |
| **High** | Update answer saving | 2 hours |
| **High** | Update report generation | 2 hours |
| Medium | Build dashboard page | 2 days |
| Low | Migrate localStorage data | 1 hour |

---

## 📊 Database Schema

```
interview_sessions (main table)
  ├── questions (all questions asked)
  │     └── answers (user responses)
  └── feedback_reports (AI feedback)

question_cache (for instant repeat loads)
```

---

## 🚀 Benefits

### What You Get:
- ✅ Persistent data (survives cache clear)
- ✅ Cross-device access
- ✅ Interview history dashboard
- ✅ Analytics and stats
- ✅ Better error recovery
- ✅ Future: ML recommendations

### What Changes:
- localStorage → Supabase database
- Browser-only → Cloud storage
- Temporary → Permanent

### What Stays the Same:
- No authentication needed (simple user ID)
- Same user experience
- Works immediately

---

## 🔧 Key Functions

```typescript
// Session management
createInterviewSession(data)      // Create new interview
completeInterviewSession(id)      // Mark as complete
getInterviewById(id)              // Get full interview

// Questions & Answers
saveQuestion(data)                // Save single question
saveQuestions(array)              // Save multiple (faster)
saveAnswer(data)                  // Save user answer

// Reports & Stats
saveFeedbackReport(data)          // Save AI feedback
getUserStats()                    // Get user statistics
getRecentInterviews(10)           // Get latest interviews

// Utilities
getUserId()                       // Get/create user ID
migrateLocalStorageToDatabase()   // Import old data
```

---

## ⚠️ Important

- **No auth required** (behind membership paywall)
- **User ID = browser-based** identifier
- **Keep localStorage** as fallback during transition
- **Test thoroughly** before removing localStorage code

---

## 🐛 Common Issues

**"Cannot find module"**
→ Check import paths: `@/lib/database/interview-service`

**"Permission denied"**
→ RLS policies need to be set up (in migration)

**"Table does not exist"**
→ Run `run-migrations.sql` first

**"User ID changes on different device"**
→ Expected behavior (no auth = browser-based)
→ Can integrate with membership system later

---

## 📞 Help

- Full guide: `PHASE_2_SUMMARY.md`
- Setup: `SUPABASE_SETUP_INSTRUCTIONS.md`
- Migration: `PHASE_2_DATABASE_MIGRATION.md`
- Code: `src/lib/database/interview-service.ts`

---

## ✅ Checklist

- [ ] Run `run-migrations.sql` in Supabase
- [ ] Test with test script (see Step 2 above)
- [ ] Update interview creation to use DB
- [ ] Update answer saving to use DB
- [ ] Update report generation to use DB
- [ ] Build dashboard page
- [ ] Test end-to-end
- [ ] Deploy to production

---

**First step:** Open Supabase and run the migration! 🚀
**Time to complete:** 5 minutes
**Difficulty:** Easy (just copy/paste SQL)

**You're one SQL query away from having persistent interview data!**
