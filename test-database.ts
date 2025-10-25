/**
 * Quick test to verify database service layer works
 */

// Load environment variables from .env.local
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import {
  createInterviewSession,
  saveQuestion,
  saveAnswer,
  saveFeedbackReport,
  getInterviewById,
  getUserInterviews,
  getUserStats
} from './src/lib/database/interview-service';

async function testDatabase() {
  console.log('🧪 Testing IG Interview Coach Database...\n');

  try {
    // 1. Create session
    console.log('1️⃣ Creating interview session...');
    const session = await createInterviewSession({
      job_description: 'Senior Software Engineer at Google. You will work on large-scale distributed systems...',
      job_title: 'Senior Software Engineer',
      company: 'Google'
    });
    console.log(`✅ Created session: ${session.id}`);
    console.log(`   Status: ${session.status}`);
    console.log(`   Job: ${session.job_data.title} at ${session.job_data.company}\n`);

    // 2. Save questions
    console.log('2️⃣ Saving questions...');
    const question1 = await saveQuestion({
      session_id: session.id,
      text: 'Tell me about a time when you had to work with a difficult team member.',
      type: 'behavioral',
      skill: 'teamwork',
      difficulty: 'medium',
      order_index: 0
    });
    console.log(`✅ Saved question 1: ${question1.id}`);

    const question2 = await saveQuestion({
      session_id: session.id,
      text: 'Can you provide a specific example of how you resolved that conflict?',
      type: 'behavioral',
      skill: 'conflict-resolution',
      difficulty: 'medium',
      order_index: 1,
      is_follow_up: true,
      parent_question_id: question1.id
    });
    console.log(`✅ Saved follow-up question: ${question2.id}\n`);

    // 3. Save answers
    console.log('3️⃣ Saving answers...');
    const answer1 = await saveAnswer({
      session_id: session.id,
      question_id: question1.id,
      content: 'In my previous role, I worked with a team member who was resistant to code reviews. I scheduled a one-on-one meeting to understand their concerns...'
    });
    console.log(`✅ Saved answer 1: ${answer1.id}`);

    const answer2 = await saveAnswer({
      session_id: session.id,
      question_id: question2.id,
      content: 'Specifically, I created a shared document outlining the benefits of code reviews, including how they caught bugs early in our project...'
    });
    console.log(`✅ Saved answer 2: ${answer2.id}\n`);

    // 4. Save feedback report
    console.log('4️⃣ Saving feedback report...');
    const report = await saveFeedbackReport({
      session_id: session.id,
      overall_score: 85,
      summary: 'Strong performance with clear examples and good structure. Shows excellent communication skills.',
      strengths: [
        'Clear STAR method structure',
        'Specific, concrete examples',
        'Demonstrated emotional intelligence'
      ],
      areas_for_improvement: [
        'Could provide more quantifiable results',
        'Expand on the long-term impact of your actions'
      ],
      next_steps: [
        'Practice adding metrics to your answers (e.g., "reduced bugs by 40%")',
        'Prepare 2-3 examples for each common behavioral question',
        'Focus on highlighting leadership qualities in your next interview'
      ]
    });
    console.log(`✅ Saved report: ${report.id}`);
    console.log(`   Overall Score: ${report.overall_score}`);
    console.log(`   Strengths: ${report.strengths.length} items`);
    console.log(`   Areas for Improvement: ${report.areas_for_improvement.length} items\n`);

    // 5. Retrieve interview
    console.log('5️⃣ Retrieving full interview...');
    const interview = await getInterviewById(session.id);
    if (interview) {
      console.log(`✅ Retrieved interview: ${interview.id}`);
      console.log(`   Questions: ${interview.questions.length}`);
      console.log(`   Answers: ${interview.answers.length}`);
      console.log(`   Reports: ${interview.feedback_reports.length}\n`);
    }

    // 6. Get user stats
    console.log('6️⃣ Getting user statistics...');
    const stats = await getUserStats();
    console.log(`✅ User Statistics:`);
    console.log(`   Total Interviews: ${stats.totalInterviews}`);
    console.log(`   Completed: ${stats.completedInterviews}`);
    console.log(`   Average Score: ${stats.averageScore}`);
    console.log(`   Last Interview: ${stats.lastInterviewDate}\n`);

    // 7. Get all user interviews
    console.log('7️⃣ Getting all user interviews...');
    const interviews = await getUserInterviews();
    console.log(`✅ Found ${interviews.length} interview(s) for this user\n`);

    console.log('🎉 All database tests passed!\n');
    console.log('✅ Database is ready to use');
    console.log('✅ Service layer is working correctly');
    console.log('✅ Ready to migrate components from localStorage\n');

    return true;
  } catch (error: any) {
    console.error('\n❌ Database test failed:');
    console.error(`   Error: ${error.message}`);
    console.error('\nPlease check:');
    console.error('   1. Run migrations in Supabase SQL Editor');
    console.error('   2. Verify environment variables are set');
    console.error('   3. Check Supabase project is active\n');
    return false;
  }
}

// Run the test
testDatabase().then(success => {
  process.exit(success ? 0 : 1);
});
