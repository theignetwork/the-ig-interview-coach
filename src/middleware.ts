import { NextRequest, NextResponse } from 'next/server';
import { OpenAICircuitBreaker, detectAbusiveContent, RateLimiter } from '@/lib/safeguards';

// IP-based rate limiting for sessions (20 per IP per 24-hour rolling window)
class IPSessionLimiter {
  private static instance: IPSessionLimiter;
  private sessionCounts: Map<string, { count: number, timestamps: number[] }> = new Map();
  private readonly MAX_SESSIONS_PER_IP = 20;
  private readonly WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  private constructor() {}

  public static getInstance(): IPSessionLimiter {
    if (!IPSessionLimiter.instance) {
      IPSessionLimiter.instance = new IPSessionLimiter();
    }
    return IPSessionLimiter.instance;
  }

  public isAllowed(ip: string): boolean {
    this.cleanupOldSessions(ip);
    const ipData = this.sessionCounts.get(ip);
    
    if (!ipData) {
      return true; // First session for this IP
    }
    
    return ipData.count < this.MAX_SESSIONS_PER_IP;
  }

  public recordSession(ip: string): void {
    const now = Date.now();
    const ipData = this.sessionCounts.get(ip) || { count: 0, timestamps: [] };
    
    ipData.count += 1;
    ipData.timestamps.push(now);
    
    this.sessionCounts.set(ip, ipData);
  }

  public getRemainingSessionsCount(ip: string): number {
    this.cleanupOldSessions(ip);
    const ipData = this.sessionCounts.get(ip);
    
    if (!ipData) {
      return this.MAX_SESSIONS_PER_IP;
    }
    
    return Math.max(0, this.MAX_SESSIONS_PER_IP - ipData.count);
  }

  public getResetTime(ip: string): Date | null {
    const ipData = this.sessionCounts.get(ip);
    
    if (!ipData || ipData.timestamps.length === 0) {
      return null;
    }
    
    // Find the earliest timestamp that's still within the window
    const oldestValidTimestamp = ipData.timestamps.sort((a, b) => a - b)[0];
    const resetTime = new Date(oldestValidTimestamp + this.WINDOW_MS);
    
    return resetTime;
  }

  private cleanupOldSessions(ip: string): void {
    const ipData = this.sessionCounts.get(ip);
    
    if (!ipData) {
      return;
    }
    
    const now = Date.now();
    const validTimestamps = ipData.timestamps.filter(
      timestamp => now - timestamp < this.WINDOW_MS
    );
    
    ipData.count = validTimestamps.length;
    ipData.timestamps = validTimestamps;
    
    this.sessionCounts.set(ip, ipData);
  }
}

/**
 * Middleware to enforce safeguards on API routes
 */
export async function middleware(request: NextRequest) {
  // Get client IP address using x-forwarded-for header (compatible with Next.js 13.4+)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  
  // 1. Check circuit breaker for OpenAI routes
  if (request.nextUrl.pathname.startsWith('/api/questions') || 
      request.nextUrl.pathname.startsWith('/api/answers') ||
      request.nextUrl.pathname.startsWith('/api/feedback')) {
    
    const circuitBreaker = OpenAICircuitBreaker.getInstance();
    const isClosed = await circuitBreaker.isClosed();
    
    if (!isClosed) {
      return NextResponse.json(
        { 
          error: 'Service temporarily unavailable due to high demand. Please try again later.',
          code: 'CIRCUIT_OPEN'
        },
        { status: 503 }
      );
    }
  }
  
  // 2. Check IP-based session limits for new sessions
  if (request.nextUrl.pathname === '/api/documents' && request.method === 'POST') {
    const ipLimiter = IPSessionLimiter.getInstance();
    
    if (!ipLimiter.isAllowed(ip)) {
      const resetTime = ipLimiter.getResetTime(ip);
      
      return NextResponse.json(
        { 
          error: "Whoa there! You've hit your daily limit of 20 practice sessions. Please come back tomorrow to keep training!",
          code: 'SESSION_LIMIT',
          resetTime: resetTime ? resetTime.toISOString() : null
        },
        { status: 429 }
      );
    }
    
    // Record this session
    ipLimiter.recordSession(ip);
    
    // Add remaining sessions headers
    const response = NextResponse.next();
    const remaining = ipLimiter.getRemainingSessionsCount(ip);
    response.headers.set('X-Sessions-Remaining', remaining.toString());
    
    const resetTime = ipLimiter.getResetTime(ip);
    if (resetTime) {
      response.headers.set('X-Session-Reset', resetTime.toISOString());
    }
    
    return response;
  }
  
  // 3. Apply rate limiting to all API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const rateLimiter = RateLimiter.getInstance();
    
    if (!rateLimiter.isAllowed(ip)) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please slow down.',
          code: 'RATE_LIMIT'
        },
        { status: 429 }
      );
    }
    
    // Record this request
    rateLimiter.recordRequest(ip);
    
    // Add rate limit headers
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Remaining', rateLimiter.getRemainingRequests(ip).toString());
    
    return response;
  }
  
  // 4. Check for abusive content in text submissions
  if ((request.nextUrl.pathname === '/api/documents' || 
       request.nextUrl.pathname.startsWith('/api/answers')) && 
      request.method === 'POST') {
    
    // Clone the request to read the body
    const clonedRequest = request.clone();
    
    try {
      // For form data (file uploads)
      if (request.headers.get('content-type')?.includes('multipart/form-data')) {
        const formData = await clonedRequest.formData();
        const text = formData.get('text') as string;
        
        if (text) {
          const abuseResult = detectAbusiveContent(text);
          
          if (abuseResult.abusive) {
            return NextResponse.json(
              { 
                error: 'Your submission contains content that violates our usage policies.',
                code: 'CONTENT_POLICY',
                details: abuseResult.details
              },
              { status: 400 }
            );
          }
        }
      } 
      // For JSON data
      else if (request.headers.get('content-type')?.includes('application/json')) {
        const body = await clonedRequest.json() as {
          text?: string;
          answer?: string;
          jobDescription?: string;
          [key: string]: any;
        };
        
        // Check text fields that might contain user input
        const textToCheck = [
          body.text,
          body.answer,
          body.jobDescription
        ].filter(Boolean).join(' ');
        
        if (textToCheck) {
          const abuseResult = detectAbusiveContent(textToCheck);
          
          if (abuseResult.abusive) {
            return NextResponse.json(
              { 
                error: 'Your submission contains content that violates our usage policies.',
                code: 'CONTENT_POLICY',
                details: abuseResult.details
              },
              { status: 400 }
            );
          }
        }
      }
    } catch (error) {
      console.error('Error checking for abusive content:', error);
      // Continue processing if we can't check for abuse
    }
  }
  
  // Allow the request to proceed
  return NextResponse.next();
}

// Configure which routes use this middleware
export const config = {
  matcher: '/api/:path*',
};
