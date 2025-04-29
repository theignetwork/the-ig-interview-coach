# The IG Interview Coach - Deployment Guide

This document provides instructions for deploying The IG Interview Coach application to Vercel.

## Prerequisites

- A Vercel account
- Git installed on your local machine
- Node.js 18+ installed on your local machine

## Deployment Files

This deployment package contains:

- `.next/`: The production build output
- `package.json`: Dependencies and scripts configuration
- `next.config.js`: Next.js configuration optimized for production
- `public/`: Static assets
- `.env.local`: Environment variables (OpenAI API key and Supabase credentials)

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard

1. Log in to your Vercel account
2. Click "Add New" > "Project"
3. Import your Git repository or upload this deployment package
4. Configure the project:
   - Framework Preset: Next.js
   - Build Command: No override needed (uses `next build` from package.json)
   - Output Directory: No override needed (uses `.next` by default)
   - Install Command: `npm install`
5. Add the environment variables from `.env.local`:
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `MAX_DAILY_SESSIONS_PER_USER` (optional)
   - `GLOBAL_DAILY_LIMIT` (optional)
   - `COOLDOWN_PERIOD_MS` (optional)
6. Click "Deploy"

### Option 2: Deploy via Vercel CLI

1. Install Vercel CLI: `npm install -g vercel`
2. Navigate to the deployment package directory
3. Run `vercel login` and follow the prompts
4. Run `vercel` and follow the prompts
5. When asked about environment variables, use the values from `.env.local`

## Post-Deployment Verification

After deployment, verify that:

1. The home page loads correctly
2. You can sign in/sign up
3. You can upload job descriptions
4. The interview process works correctly
5. Voice recording functionality works
6. Feedback generation works

## Troubleshooting

If you encounter issues:

1. Check Vercel deployment logs for errors
2. Verify all environment variables are correctly set
3. Ensure the OpenAI API key has access to both GPT-4 and Whisper APIs
4. Check Supabase connection by verifying database operations

## Next Steps

- Set up a custom domain in Vercel dashboard
- Configure analytics if needed
- Set up monitoring for production use

For any questions or issues, please contact the development team.
