import { NextRequest, NextResponse } from 'next/server';
import { analyzeAnswer, detectDangerZones, generateFollowUpQuestion } from '@/lib/openai';
import { updateSessionAnswer, getCurrentUser } from '@/lib/supabase';

/**
 * API route for analyzing interview answers
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
      questionId: string;
      answer: string;
      question: any;
      jobData: any;
    };
    
    const { sessionId, questionId, answer, question, jobData } = data;
    
    if (!sessionId || !questionId || !answer || !question || !jobData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Analyze answer with GPT-4.1
    const analysis = await analyzeAnswer(
      question,
      answer,
      jobData,
      user.id,
      sessionId
    );
    
    // Detect danger zones
    const dangerZones = await detectDangerZones(
      question,
      answer,
      jobData,
      user.id,
      sessionId
    );
    
    // Generate follow-up question if needed
    let followUpQuestion = null;
    if (analysis.needsFollowUp && dangerZones.length > 0) {
      followUpQuestion = await generateFollowUpQuestion(
        question,
        answer,
        analysis,
        user.id,
        sessionId
      );
    }
    
    // Update session with answer and analysis
    await updateSessionAnswer(
      sessionId,
      questionId,
      answer,
      {
        ...analysis,
        dangerZones,
        followUpQuestion
      }
    );
    
    return NextResponse.json({
      success: true,
      analysis,
      dangerZones,
      followUpQuestion
    });
  } catch (error) {
    console.error('Error analyzing answer:', error);
    return NextResponse.json(
      { error: 'Failed to analyze answer' },
      { status: 500 }
    );
  }
}
