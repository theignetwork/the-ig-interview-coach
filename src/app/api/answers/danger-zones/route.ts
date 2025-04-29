import { NextRequest, NextResponse } from 'next/server';
import { detectDangerZones } from '@/lib/openai';
import { getCurrentUser } from '@/lib/supabase';

/**
 * API route for detecting danger zones in answers
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
    
    // Detect danger zones with GPT-4.1
    const dangerZones = await detectDangerZones(
      question,
      answer,
      jobData,
      user.id,
      sessionId
    );
    
    return NextResponse.json({
      success: true,
      dangerZones
    });
  } catch (error) {
    console.error('Error detecting danger zones:', error);
    return NextResponse.json(
      { error: 'Failed to detect danger zones' },
      { status: 500 }
    );
  }
}
