import { NextRequest, NextResponse } from 'next/server';
import { generateFeedbackReport } from '@/lib/openai';
import { storeFeedbackReport, getCurrentUser, completeInterviewSession } from '@/lib/supabase';

/**
 * API route for generating feedback reports
 */
export async function POST(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json() as {
      sessionId: string;
      jobData: any;
      questions: any[];
      answers: Record<string, string>;
      analyses: Record<string, any>;
    };
    
    const { sessionId, jobData, questions, answers, analyses } = data;
    
    if (!sessionId || !jobData || !questions || !answers || !analyses) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Generate feedback report with GPT-4.1
    const report = await generateFeedbackReport(
      jobData,
      questions,
      answers,
      analyses,
      user.id,
      sessionId
    );
    
    // Store feedback report
    const storedReport = await storeFeedbackReport(
      sessionId,
      user.id,
      report,
      report.overallScore
    );
    
    if (!storedReport) {
      throw new Error('Failed to store feedback report');
    }
    
    // Mark interview session as completed
    await completeInterviewSession(sessionId);
    
    return NextResponse.json({
      success: true,
      reportId: storedReport.id,
      report
    });
  } catch (error) {
    console.error('Error generating feedback report:', error);
    return NextResponse.json(
      { error: 'Failed to generate feedback report' },
      { status: 500 }
    );
  }
}
