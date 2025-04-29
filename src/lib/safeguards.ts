/**
 * Safeguards and circuit breakers for the Mock Job Interview Bot
 */

import { checkCircuitBreaker } from '@/lib/supabase';

/**
 * Circuit breaker for OpenAI API calls
 * Prevents API calls if global limit is reached
 */
export class OpenAICircuitBreaker {
  private static instance: OpenAICircuitBreaker;
  private closed: boolean = true; // closed = allowing traffic
  private lastChecked: number = 0;
  private checkInterval: number = 60000; // 1 minute
  
  private constructor() {}
  
  /**
   * Gets the singleton instance
   * @returns Circuit breaker instance
   */
  public static getInstance(): OpenAICircuitBreaker {
    if (!OpenAICircuitBreaker.instance) {
      OpenAICircuitBreaker.instance = new OpenAICircuitBreaker();
    }
    return OpenAICircuitBreaker.instance;
  }
  
  /**
   * Checks if the circuit is closed (allowing traffic)
   * @returns Whether API calls are allowed
   */
  public async isClosed(): Promise<boolean> {
    const now = Date.now();
    
    // Only check the database periodically to reduce load
    if (now - this.lastChecked > this.checkInterval) {
      this.closed = await checkCircuitBreaker();
      this.lastChecked = now;
    }
    
    return this.closed;
  }
  
  /**
   * Executes a function if the circuit is closed
   * @param fn Function to execute
   * @returns Function result or error
   */
  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (await this.isClosed()) {
      try {
        return await fn();
      } catch (error) {
        // If we get a rate limit or quota error, open the circuit
        if (error instanceof Error && 
            (error.message.includes('rate limit') || 
             error.message.includes('quota'))) {
          this.closed = false;
          this.lastChecked = Date.now();
        }
        throw error;
      }
    } else {
      throw new Error('Circuit breaker is open. API calls are currently disabled.');
    }
  }
}

/**
 * Session limit checker
 * Enforces daily session limits per user
 */
export interface SessionLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  warningLevel: 'none' | 'soft' | 'hard';
}

export async function checkSessionLimits(userId: string): Promise<SessionLimitResult> {
  try {
    // In a real implementation, this would call the Supabase RPC function
    // For the prototype, we'll simulate the check
    
    // Get settings
    const maxSessions = 5;
    const softWarningThreshold = 3;
    const hardWarningThreshold = 4;
    
    // Simulate user's current count (would come from database)
    const userCount = Math.floor(Math.random() * 6); // 0-5 for demo
    const remaining = Math.max(0, maxSessions - userCount);
    const allowed = userCount < maxSessions;
    
    // Calculate warning level
    let warningLevel: 'none' | 'soft' | 'hard' = 'none';
    if (userCount >= hardWarningThreshold) {
      warningLevel = 'hard';
    } else if (userCount >= softWarningThreshold) {
      warningLevel = 'soft';
    }
    
    // Calculate reset time (next day)
    const resetTime = new Date();
    resetTime.setDate(resetTime.getDate() + 1);
    resetTime.setHours(0, 0, 0, 0);
    
    return {
      allowed,
      remaining,
      resetTime,
      warningLevel
    };
  } catch (error) {
    console.error('Error checking session limits:', error);
    // Default to not allowed if there's an error
    return {
      allowed: false,
      remaining: 0,
      resetTime: new Date(),
      warningLevel: 'hard'
    };
  }
}

/**
 * Abuse detection system
 * Identifies potential abuse patterns
 */
export interface AbuseDetectionResult {
  abusive: boolean;
  confidence: number;
  flagType?: string;
  details?: string;
}

export function detectAbusiveContent(text: string): AbuseDetectionResult {
  // In a real implementation, this would use more sophisticated detection
  // For the prototype, we'll do basic checks
  
  // Check for obvious abuse indicators
  const lowerText = text.toLowerCase();
  
  // Check for potentially harmful content
  const harmfulPatterns = [
    'hack', 'exploit', 'vulnerability', 'illegal', 'attack',
    'steal', 'password', 'credit card', 'ssn', 'social security'
  ];
  
  const harmfulMatch = harmfulPatterns.find(pattern => lowerText.includes(pattern));
  
  if (harmfulMatch) {
    return {
      abusive: true,
      confidence: 0.7,
      flagType: 'potentially_harmful',
      details: `Contains potentially harmful content: ${harmfulMatch}`
    };
  }
  
  // Check for excessive length (potential prompt injection)
  if (text.length > 10000) {
    return {
      abusive: true,
      confidence: 0.6,
      flagType: 'excessive_length',
      details: `Text length (${text.length}) exceeds reasonable limits`
    };
  }
  
  // Check for repetitive patterns (potential attack)
  const repetitionCheck = /(.{20,})\1{3,}/;
  if (repetitionCheck.test(text)) {
    return {
      abusive: true,
      confidence: 0.8,
      flagType: 'repetitive_pattern',
      details: 'Contains highly repetitive patterns'
    };
  }
  
  // No abuse detected
  return {
    abusive: false,
    confidence: 0.9
  };
}

/**
 * Rate limiter for API endpoints
 * Prevents excessive requests from a single user
 */
export class RateLimiter {
  private static instance: RateLimiter;
  private requests: Record<string, number[]> = {};
  private maxRequests: number = 10;
  private timeWindow: number = 60000; // 1 minute
  
  private constructor() {}
  
  /**
   * Gets the singleton instance
   * @returns Rate limiter instance
   */
  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }
  
  /**
   * Checks if a request is allowed
   * @param userId User ID
   * @returns Whether the request is allowed
   */
  public isAllowed(userId: string): boolean {
    const now = Date.now();
    
    // Initialize if not exists
    if (!this.requests[userId]) {
      this.requests[userId] = [];
    }
    
    // Remove expired timestamps
    this.requests[userId] = this.requests[userId].filter(
      timestamp => now - timestamp < this.timeWindow
    );
    
    // Check if under limit
    return this.requests[userId].length < this.maxRequests;
  }
  
  /**
   * Records a request
   * @param userId User ID
   */
  public recordRequest(userId: string): void {
    const now = Date.now();
    
    // Initialize if not exists
    if (!this.requests[userId]) {
      this.requests[userId] = [];
    }
    
    // Add current timestamp
    this.requests[userId].push(now);
  }
  
  /**
   * Gets remaining requests in the current window
   * @param userId User ID
   * @returns Number of remaining requests
   */
  public getRemainingRequests(userId: string): number {
    const now = Date.now();
    
    // Initialize if not exists
    if (!this.requests[userId]) {
      this.requests[userId] = [];
    }
    
    // Remove expired timestamps
    this.requests[userId] = this.requests[userId].filter(
      timestamp => now - timestamp < this.timeWindow
    );
    
    // Calculate remaining
    return Math.max(0, this.maxRequests - this.requests[userId].length);
  }
}

/**
 * Document validation with enhanced security checks
 * @param file File to validate
 * @returns Validation result
 */
export function validateDocumentSecurity(file: File): { valid: boolean; error?: string } {
  // Check file size (50MB limit)
  if (file.size > 50 * 1024 * 1024) {
    return {
      valid: false,
      error: `File size exceeds the maximum limit of 50MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`
    };
  }
  
  // Check file type
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    // Double-check extension as fallback
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.pdf', '.docx'].includes(extension)) {
      return {
        valid: false,
        error: 'Invalid file type. Please upload a PDF or DOCX file.'
      };
    }
  }
  
  // Check filename for potential security issues
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    return {
      valid: false,
      error: 'Invalid filename. Please rename your file and try again.'
    };
  }
  
  return { valid: true };
}

/**
 * Generates a warning message based on session limit status
 * @param limitResult Session limit check result
 * @returns Warning message if needed
 */
export function getSessionLimitWarning(limitResult: SessionLimitResult): string | null {
  if (limitResult.warningLevel === 'hard') {
    return `Warning: You have only ${limitResult.remaining} interview sessions remaining today. Your limit will reset at ${limitResult.resetTime.toLocaleTimeString()} on ${limitResult.resetTime.toLocaleDateString()}.`;
  } else if (limitResult.warningLevel === 'soft') {
    return `Note: You have ${limitResult.remaining} interview sessions remaining today. Your limit will reset at midnight.`;
  }
  
  return null;
}
