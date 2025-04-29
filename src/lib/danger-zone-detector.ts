/**
 * Danger zone detection utilities for the Mock Job Interview Bot
 */

import type { InterviewQuestion, JobDescriptionData, AnswerAnalysis } from '@/lib/openai';

/**
 * Analyzes an answer to detect missing competencies and danger zones
 * @param question The interview question
 * @param answer The candidate's answer
 * @param jobData The job description data
 * @returns Analysis with detected danger zones
 */
export async function detectDangerZones(
  question: InterviewQuestion,
  answer: string,
  jobData: JobDescriptionData
): Promise<DangerZoneAnalysis> {
  // This would normally call the OpenAI API directly
  // For the prototype, we'll use the existing analyzeAnswer function
  
  // Import dynamically to avoid circular dependencies
  const { analyzeAnswer } = await import('@/lib/openai');
  
  // Get basic analysis
  // Use a mock user ID for prototype testing
  const mockUserId = 'test-user-id';
  const analysis = await analyzeAnswer(question, answer, jobData, mockUserId);
  
  // Enhance with danger zone detection
  const dangerZones = identifyDangerZones(analysis, question, answer, jobData);
  
  return {
    ...analysis,
    dangerZones,
    dangerZoneScore: calculateDangerZoneScore(dangerZones),
    requiresFollowUp: dangerZones.length > 0 && analysis.needsFollowUp
  };
}

/**
 * Identifies specific danger zones based on analysis and job data
 * @param analysis Basic answer analysis
 * @param question The interview question
 * @param answer The candidate's answer
 * @param jobData The job description data
 * @returns Identified danger zones
 */
function identifyDangerZones(
  analysis: AnswerAnalysis,
  question: InterviewQuestion,
  answer: string,
  jobData: JobDescriptionData
): DangerZone[] {
  const dangerZones: DangerZone[] = [];
  
  // Check for missing required skills
  if (question.type === 'technical') {
    const relatedSkills = jobData.requiredSkills.filter(skill => 
      question.skill.toLowerCase().includes(skill.toLowerCase()) ||
      skill.toLowerCase().includes(question.skill.toLowerCase())
    );
    
    if (relatedSkills.length > 0 && analysis.missingCompetencies.length > 0) {
      dangerZones.push({
        type: 'missing_required_skill',
        skill: question.skill,
        severity: 'high',
        description: `Missing demonstration of ${question.skill} which is a required skill for this role.`
      });
    }
  }
  
  // Check for behavioral red flags
  if (question.type === 'behavioral') {
    const weaknessIndicators = analysis.weaknesses.some(weakness => 
      weakness.toLowerCase().includes('specific') ||
      weakness.toLowerCase().includes('example') ||
      weakness.toLowerCase().includes('detail')
    );
    
    if (weaknessIndicators) {
      dangerZones.push({
        type: 'vague_response',
        skill: question.skill,
        severity: 'medium',
        description: 'Response lacks specific examples or details that demonstrate the competency.'
      });
    }
  }
  
  // Check for situational judgment issues
  if (question.type === 'situational' && analysis.score < 6) {
    dangerZones.push({
      type: 'poor_situational_judgment',
      skill: question.skill,
      severity: 'high',
      description: 'Response indicates potential issues with situational judgment in this area.'
    });
  }
  
  // Check for alignment with company values
  const valueAlignment = jobData.companyValues.some(value => 
    answer.toLowerCase().includes(value.toLowerCase())
  );
  
  if (!valueAlignment && jobData.companyValues.length > 0) {
    dangerZones.push({
      type: 'value_misalignment',
      skill: 'Company Culture',
      severity: 'medium',
      description: 'Response does not demonstrate alignment with company values.'
    });
  }
  
  return dangerZones;
}

/**
 * Calculates an overall danger zone score
 * @param dangerZones Identified danger zones
 * @returns Numeric score (0-10, higher means more concerning)
 */
function calculateDangerZoneScore(dangerZones: DangerZone[]): number {
  if (dangerZones.length === 0) {
    return 0;
  }
  
  // Calculate based on number and severity of danger zones
  const severityScores = {
    'low': 1,
    'medium': 2,
    'high': 3
  };
  
  const totalSeverity = dangerZones.reduce((sum, zone) => {
    return sum + severityScores[zone.severity];
  }, 0);
  
  // Scale to 0-10
  const maxPossibleScore = dangerZones.length * 3; // if all were high severity
  return Math.min(10, (totalSeverity / maxPossibleScore) * 10);
}

/**
 * Generates a targeted follow-up question based on detected danger zones
 * @param question Original question
 * @param answer Original answer
 * @param analysis Danger zone analysis
 * @returns Targeted follow-up question
 */
export async function generateTargetedFollowUp(
  question: InterviewQuestion,
  answer: string,
  analysis: DangerZoneAnalysis
): Promise<string> {
  // This would normally call the OpenAI API directly
  // For the prototype, we'll use the existing generateFollowUpQuestion function
  
  // Import dynamically to avoid circular dependencies
  const { generateFollowUpQuestion } = await import('@/lib/openai');
  
  // Get basic follow-up
  // Use a mock user ID for prototype testing
  const mockUserId = 'test-user-id';
  const basicFollowUp = await generateFollowUpQuestion(question, answer, analysis, mockUserId);
  
  // If there are danger zones, enhance the follow-up to target them
  if (analysis.dangerZones.length > 0) {
    const primaryDangerZone = analysis.dangerZones[0];
    
    // Enhance with danger zone targeting
    const targetedPrompts = {
      'missing_required_skill': `Could you share a specific example of how you've used ${primaryDangerZone.skill} in a previous role? I'm particularly interested in your hands-on experience.`,
      'vague_response': `I'd like to dive deeper into a specific example. Can you walk me through a situation where you demonstrated ${primaryDangerZone.skill}, including the context, your actions, and the outcome?`,
      'poor_situational_judgment': `Let's explore this scenario further. If you encountered resistance or complications in this situation, how would you adapt your approach?`,
      'value_misalignment': `Our company values ${analysis.dangerZones[0].skill}. Could you share an example of how you've demonstrated this value in your previous work?`
    };
    
    return targetedPrompts[primaryDangerZone.type as keyof typeof targetedPrompts] || basicFollowUp;
  }
  
  return basicFollowUp;
}

// Type definitions
export interface DangerZone {
  type: 'missing_required_skill' | 'vague_response' | 'poor_situational_judgment' | 'value_misalignment';
  skill: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface DangerZoneAnalysis extends AnswerAnalysis {
  dangerZones: DangerZone[];
  dangerZoneScore: number;
  requiresFollowUp: boolean;
}
