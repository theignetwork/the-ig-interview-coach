/**
 * OpenAI integration for the Mock Job Interview Bot
 */

import OpenAI from 'openai';
import { checkCircuitBreaker, trackTokenUsage } from './supabase';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Model to use for all requests (GPT-4.1 as specified by user)
const MODEL = 'gpt-4-1106-preview';

/**
 * Parses a job description using GPT-4.1
 * @param jobDescription The job description text
 * @param userId User ID for tracking
 * @param sessionId Optional session ID for tracking
 * @returns Structured job information
 */
export async function parseJobDescription(
  jobDescription: string,
  userId: string,
  sessionId?: string
): Promise<JobDescriptionData> {
  try {
    // Check if circuit breaker is closed
    const apiCallsAllowed = await checkCircuitBreaker();
    if (!apiCallsAllowed) {
      throw new Error('API calls are currently disabled due to usage limits');
    }

    console.log('Parsing job description with GPT-4.1...');
    
    const prompt = `
      You are an expert job description analyzer. Parse the following job description into a structured format.
      Extract the following information:
      - Job title
      - Company name (if available)
      - Required skills (technical and soft skills explicitly mentioned as requirements)
      - Preferred skills (skills mentioned as "nice to have" or "preferred")
      - Key responsibilities
      - Qualifications (education, experience, certifications)
      - Company values (if mentioned)
      
      Format your response as a valid JSON object with these fields. If any field is not found, return an empty array or null.
      
      Job Description:
      ${jobDescription}
    `;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are an expert job description analyzer that extracts structured information.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    // Track token usage
    if (response.usage) {
      await trackTokenUsage(
        userId,
        sessionId || null,
        'parseJobDescription',
        response.usage.prompt_tokens,
        response.usage.completion_tokens
      );
    }

    // Parse the response
    const content = response.choices[0]?.message?.content || '{}';
    const parsedData = JSON.parse(content) as JobDescriptionData;
    
    // Ensure all fields exist
    return {
      jobTitle: parsedData.jobTitle || 'Unknown Position',
      company: parsedData.company || 'Unknown Company',
      requiredSkills: parsedData.requiredSkills || [],
      preferredSkills: parsedData.preferredSkills || [],
      responsibilities: parsedData.responsibilities || [],
      qualifications: parsedData.qualifications || [],
      companyValues: parsedData.companyValues || []
    };
  } catch (error) {
    console.error('Error parsing job description:', error);
    throw error;
  }
}

/**
 * Generates interview questions based on job description data
 * @param jobData Parsed job description data
 * @param userId User ID for tracking
 * @param sessionId Optional session ID for tracking
 * @param count Number of questions to generate
 * @returns Generated questions
 */
export async function generateInterviewQuestions(
  jobData: JobDescriptionData,
  userId: string,
  sessionId?: string,
  count: number = 10
): Promise<InterviewQuestion[]> {
  try {
    // Check if circuit breaker is closed
    const apiCallsAllowed = await checkCircuitBreaker();
    if (!apiCallsAllowed) {
      throw new Error('API calls are currently disabled due to usage limits');
    }

    console.log('Generating interview questions with GPT-4.1...');
    
    const prompt = `
      You are an expert technical interviewer. Generate ${count} interview questions for a ${jobData.jobTitle} position at ${jobData.company}.
      
      Job details:
      - Required skills: ${jobData.requiredSkills.join(', ')}
      - Preferred skills: ${jobData.preferredSkills.join(', ')}
      - Responsibilities: ${jobData.responsibilities.join(', ')}
      - Qualifications: ${jobData.qualifications.join(', ')}
      
      Create a mix of:
      - Technical questions that assess the required skills
      - Behavioral questions that evaluate soft skills and cultural fit
      - Situational questions that test problem-solving abilities
      
      For each question, include:
      - A unique ID (q1, q2, etc.)
      - The question text
      - Type (technical, behavioral, or situational)
      - The primary skill being assessed
      - Difficulty level (easy, medium, or hard)
      
      Format your response as a valid JSON array of question objects.
    `;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are an expert technical interviewer that creates relevant and challenging interview questions.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    // Track token usage
    if (response.usage) {
      await trackTokenUsage(
        userId,
        sessionId || null,
        'generateInterviewQuestions',
        response.usage.prompt_tokens,
        response.usage.completion_tokens
      );
    }

    // Parse the response
    const content = response.choices[0]?.message?.content || '{"questions":[]}';
    const parsedData = JSON.parse(content);
    const questions = parsedData.questions || [];
    
    return questions.map((q: any, index: number) => ({
      id: q.id || `q${index + 1}`,
      text: q.text,
      type: q.type || 'technical',
      skill: q.skill,
      difficulty: q.difficulty || 'medium'
    }));
  } catch (error) {
    console.error('Error generating interview questions:', error);
    throw error;
  }
}

/**
 * Analyzes an answer to detect missing competencies
 * @param question The interview question
 * @param answer The candidate's answer
 * @param jobData The job description data
 * @param userId User ID for tracking
 * @param sessionId Optional session ID for tracking
 * @returns Analysis result with detected gaps
 */
export async function analyzeAnswer(
  question: InterviewQuestion,
  answer: string,
  jobData: JobDescriptionData,
  userId: string,
  sessionId?: string
): Promise<AnswerAnalysis> {
  try {
    // Check if circuit breaker is closed
    const apiCallsAllowed = await checkCircuitBreaker();
    if (!apiCallsAllowed) {
      throw new Error('API calls are currently disabled due to usage limits');
    }

    console.log('Analyzing answer with GPT-4.1...');
    
    const prompt = `
      You are an expert interview evaluator. Analyze the following candidate answer to an interview question.
      
      Job Position: ${jobData.jobTitle}
      Required Skills: ${jobData.requiredSkills.join(', ')}
      
      Question (${question.type}, testing ${question.skill}): ${question.text}
      
      Candidate Answer: ${answer}
      
      Provide an analysis with:
      1. Strengths (what the candidate did well)
      2. Weaknesses (what could be improved)
      3. Missing competencies (specific skills or knowledge areas that weren't demonstrated)
      4. Score (1-10 scale, where 10 is excellent)
      5. Whether a follow-up question is needed (true/false)
      
      Format your response as a valid JSON object.
    `;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are an expert interview evaluator that provides detailed and constructive feedback.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    // Track token usage
    if (response.usage) {
      await trackTokenUsage(
        userId,
        sessionId || null,
        'analyzeAnswer',
        response.usage.prompt_tokens,
        response.usage.completion_tokens
      );
    }

    // Parse the response
    const content = response.choices[0]?.message?.content || '{}';
    const analysis = JSON.parse(content) as AnswerAnalysis;
    
    // Ensure all fields exist
    return {
      strengths: analysis.strengths || [],
      weaknesses: analysis.weaknesses || [],
      missingCompetencies: analysis.missingCompetencies || [],
      score: analysis.score || 5,
      needsFollowUp: analysis.needsFollowUp || false
    };
  } catch (error) {
    console.error('Error analyzing answer:', error);
    throw error;
  }
}

/**
 * Generates a follow-up question based on detected gaps
 * @param question The original interview question
 * @param answer The candidate's answer
 * @param analysis The answer analysis
 * @param userId User ID for tracking
 * @param sessionId Optional session ID for tracking
 * @returns Follow-up question
 */
export async function generateFollowUpQuestion(
  question: InterviewQuestion,
  answer: string,
  analysis: AnswerAnalysis,
  userId: string,
  sessionId?: string
): Promise<string> {
  try {
    // Check if circuit breaker is closed
    const apiCallsAllowed = await checkCircuitBreaker();
    if (!apiCallsAllowed) {
      throw new Error('API calls are currently disabled due to usage limits');
    }

    console.log('Generating follow-up question with GPT-4.1...');
    
    const prompt = `
      You are an expert technical interviewer. Generate a follow-up question based on a candidate's answer.
      
      Original Question: ${question.text}
      Skill Being Tested: ${question.skill}
      
      Candidate Answer: ${answer}
      
      Analysis:
      - Strengths: ${analysis.strengths.join(', ')}
      - Weaknesses: ${analysis.weaknesses.join(', ')}
      - Missing Competencies: ${analysis.missingCompetencies.join(', ')}
      
      Create a follow-up question that:
      1. Probes deeper into one of the missing competencies
      2. Gives the candidate a chance to demonstrate knowledge they didn't show
      3. Is specific and targeted (not general)
      4. Maintains a professional and supportive tone
      
      Return only the follow-up question text, without any additional explanation.
    `;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are an expert technical interviewer that creates targeted follow-up questions.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5
    });

    // Track token usage
    if (response.usage) {
      await trackTokenUsage(
        userId,
        sessionId || null,
        'generateFollowUpQuestion',
        response.usage.prompt_tokens,
        response.usage.completion_tokens
      );
    }

    // Return the follow-up question
    return response.choices[0]?.message?.content || 
      "Could you elaborate more on your experience with this specific area?";
  } catch (error) {
    console.error('Error generating follow-up question:', error);
    throw error;
  }
}

/**
 * Generates a comprehensive feedback report
 * @param jobData The job description data
 * @param questions The interview questions
 * @param answers The candidate's answers
 * @param analyses The answer analyses
 * @param userId User ID for tracking
 * @param sessionId Optional session ID for tracking
 * @returns Feedback report
 */
export async function generateFeedbackReport(
  jobData: JobDescriptionData,
  questions: InterviewQuestion[],
  answers: Record<string, string>,
  analyses: Record<string, AnswerAnalysis>,
  userId: string,
  sessionId?: string
): Promise<FeedbackReport> {
  try {
    // Check if circuit breaker is closed
    const apiCallsAllowed = await checkCircuitBreaker();
    if (!apiCallsAllowed) {
      throw new Error('API calls are currently disabled due to usage limits');
    }

    console.log('Generating feedback report with GPT-4.1...');
    
    // Calculate overall score
    const questionIds = Object.keys(answers);
    const totalScore = questionIds.reduce((sum, id) => {
      return sum + (analyses[id]?.score || 0);
    }, 0);
    const overallScore = questionIds.length > 0 ? totalScore / questionIds.length : 0;
    
    // Prepare question and answer data for the prompt
    const qaData = questionIds.map(id => {
      const q = questions.find(q => q.id === id);
      return {
        question: q?.text || '',
        type: q?.type || '',
        skill: q?.skill || '',
        answer: answers[id] || '',
        analysis: analyses[id] || { strengths: [], weaknesses: [], score: 0 }
      };
    });
    
    const prompt = `
      You are an expert interview coach. Generate a comprehensive feedback report for a candidate interview.
      
      Job Position: ${jobData.jobTitle}
      Company: ${jobData.company}
      Required Skills: ${jobData.requiredSkills.join(', ')}
      
      Interview Performance:
      ${JSON.stringify(qaData, null, 2)}
      
      Overall Score: ${overallScore.toFixed(1)} / 10
      
      Create a detailed feedback report with:
      1. A summary of overall performance
      2. Key strengths demonstrated across all answers
      3. Areas for improvement
      4. Question-by-question feedback with SOAR method recommendations
      5. Specific next steps for the candidate
      
      Format your response as a valid JSON object with these sections.
      For the SOAR method recommendations, use this format:
      Situation: Choose a specific example that demonstrates expertise
      Task: Define what needed to be accomplished
      Action: Detail steps taken, focusing on personal contribution
      Result: Quantify positive outcomes
    `;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are an expert interview coach that provides detailed and constructive feedback.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' }
    });

    // Track token usage
    if (response.usage) {
      await trackTokenUsage(
        userId,
        sessionId || null,
        'generateFeedbackReport',
        response.usage.prompt_tokens,
        response.usage.completion_tokens
      );
    }

    // Parse the response
    const content = response.choices[0]?.message?.content || '{}';
    const report = JSON.parse(content);
    
    // Ensure all fields exist
    return {
      overallScore,
      summary: report.summary || `Overall performance score: ${overallScore.toFixed(1)}/10`,
      strengths: report.strengths || [],
      areasForImprovement: report.areasForImprovement || [],
      questionFeedback: report.questionFeedback || [],
      nextSteps: report.nextSteps || []
    };
  } catch (error) {
    console.error('Error generating feedback report:', error);
    throw error;
  }
}

/**
 * Detects danger zones in an answer
 * @param question The interview question
 * @param answer The candidate's answer
 * @param jobData The job description data
 * @param userId User ID for tracking
 * @param sessionId Optional session ID for tracking
 * @returns Detected danger zones
 */
export async function detectDangerZones(
  question: InterviewQuestion,
  answer: string,
  jobData: JobDescriptionData,
  userId: string,
  sessionId?: string
): Promise<string[]> {
  try {
    // Check if circuit breaker is closed
    const apiCallsAllowed = await checkCircuitBreaker();
    if (!apiCallsAllowed) {
      throw new Error('API calls are currently disabled due to usage limits');
    }

    console.log('Detecting danger zones with GPT-4.1...');
    
    const prompt = `
      You are an expert interview evaluator. Identify "danger zones" in the following candidate answer.
      
      Danger zones are critical missing elements that would raise red flags for interviewers, such as:
      - Missing technical knowledge that's essential for the role
      - Lack of experience with key technologies mentioned in the job description
      - Absence of important soft skills required for the position
      - Failure to demonstrate problem-solving approach
      - Missing context or specificity in examples
      
      Job Position: ${jobData.jobTitle}
      Required Skills: ${jobData.requiredSkills.join(', ')}
      
      Question (${question.type}, testing ${question.skill}): ${question.text}
      
      Candidate Answer: ${answer}
      
      List only the specific danger zones detected, with no additional explanation.
      Format your response as a valid JSON array of strings.
    `;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are an expert interview evaluator that identifies critical gaps in candidate answers.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    // Track token usage
    if (response.usage) {
      await trackTokenUsage(
        userId,
        sessionId || null,
        'detectDangerZones',
        response.usage.prompt_tokens,
        response.usage.completion_tokens
      );
    }

    // Parse the response
    const content = response.choices[0]?.message?.content || '{"dangerZones":[]}';
    const result = JSON.parse(content);
    
    return result.dangerZones || [];
  } catch (error) {
    console.error('Error detecting danger zones:', error);
    throw error;
  }
}

// Type definitions
export interface JobDescriptionData {
  jobTitle: string;
  company: string;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  qualifications: string[];
  companyValues: string[];
}

export interface InterviewQuestion {
  id: string;
  text: string;
  type: 'technical' | 'behavioral' | 'situational';
  skill: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface AnswerAnalysis {
  strengths: string[];
  weaknesses: string[];
  missingCompetencies: string[];
  score: number;
  needsFollowUp: boolean;
}

export interface QuestionFeedback {
  question: string;
  strengths: string[];
  weaknesses: string[];
  score: number;
  improvement: string;
}

export interface FeedbackReport {
  overallScore: number;
  summary: string;
  strengths: string[];
  areasForImprovement: string[];
  questionFeedback: QuestionFeedback[];
  nextSteps: string[];
}
