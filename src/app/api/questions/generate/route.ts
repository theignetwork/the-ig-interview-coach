import { NextRequest, NextResponse } from 'next/server';
import { generateInterviewQuestions } from '@/lib/openai';
import { createInterviewSession, getCurrentUser } from '@/lib/supabase';

/**
 * API route for generating interview questions
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
      documentId: string;
      jobData: any;
    };
    
    const { documentId, jobData } = data;
    
    if (!documentId || !jobData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Generate questions with GPT-4.1
    const questions = await generateInterviewQuestions(
      jobData,
      user.id,
      undefined, // Session ID will be created after this
      10 // Generate 10 questions
    );
    
    // Create interview session
    const session = await createInterviewSession(
      user.id,
      documentId,
      questions
    );
    
    if (!session) {
      throw new Error('Failed to create interview session');
    }
    
    return NextResponse.json({
      success: true,
      sessionId: session.id,
      questions
    });
  } catch (error) {
    console.error('Error generating questions:', error);
    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    );
  }
}
