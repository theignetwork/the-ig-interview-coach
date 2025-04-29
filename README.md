# The IG Interview Coach

A Next.js application that helps users practice interview skills with AI-generated questions based on job descriptions.

## Features

- Job description upload (PDF/DOCX) or text input
- AI-generated interview questions based on job requirements
- Voice input for answering questions using Whisper API
- Detailed feedback and improvement suggestions
- IP-based rate limiting (20 sessions per IP per 24-hour rolling window)
- Dark mode UI with teal accents

## Technical Stack

- Next.js 15.1.4
- React 19.1.0
- Tailwind CSS
- OpenAI API (GPT-4 and Whisper)
- Supabase for data storage

## Rate Limiting

The application implements IP-based rate limiting with the following characteristics:
- 20 sessions per IP address per 24-hour rolling window
- Friendly error message when limit is reached
- Reset time based on the timestamp of the oldest session within the window

## Deployment Instructions

1. Extract the zip file
2. Upload to Vercel through their dashboard or CLI
3. Add the environment variables from .env.local
4. Deploy and verify functionality

## Environment Variables

Make sure to set the following environment variables in your Vercel project:

```
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Optional configuration variables:
```
MAX_DAILY_SESSIONS_PER_IP=20
GLOBAL_DAILY_LIMIT=1000
COOLDOWN_PERIOD_MS=3600000
```
