import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Simple string hash function for cache keys
 * Uses a basic hash algorithm that's fast and good enough for cache keys
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Get cached questions for a job description
 * Cache is valid for 24 hours
 * @param jobDescription - The job description to check cache for
 * @returns Cached questions array or null if not found/expired
 */
export async function getCachedQuestions(jobDescription: string): Promise<any[] | null> {
  try {
    const cacheKey = hashString(jobDescription.trim().toLowerCase());

    // Check cache (valid for 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('question_cache')
      .select('questions')
      .eq('cache_key', cacheKey)
      .gte('created_at', twentyFourHoursAgo)
      .single();

    if (error) {
      // Not found or other error - return null (will generate new)
      console.log('Cache miss:', cacheKey.substring(0, 8));
      return null;
    }

    console.log('✅ Cache hit:', cacheKey.substring(0, 8));
    return data?.questions || null;
  } catch (err) {
    console.error('Cache lookup error:', err);
    return null; // Fail gracefully - generate new questions
  }
}

/**
 * Save questions to cache for future use
 * @param jobDescription - The job description these questions are for
 * @param questions - Array of question objects to cache
 */
export async function setCachedQuestions(
  jobDescription: string,
  questions: any[]
): Promise<void> {
  try {
    const cacheKey = hashString(jobDescription.trim().toLowerCase());
    const snippet = jobDescription.substring(0, 500); // Store first 500 chars for reference

    await supabase
      .from('question_cache')
      .upsert(
        {
          cache_key: cacheKey,
          job_description_snippet: snippet,
          questions,
          created_at: new Date().toISOString()
        },
        {
          onConflict: 'cache_key' // Update if already exists
        }
      );

    console.log('💾 Cached questions:', cacheKey.substring(0, 8));
  } catch (err) {
    console.error('Cache save error:', err);
    // Don't throw - caching is optional, failure shouldn't break the flow
  }
}

/**
 * Manually clear cache for a specific job description
 * Useful for testing or if users report stale questions
 */
export async function clearCache(jobDescription: string): Promise<void> {
  try {
    const cacheKey = hashString(jobDescription.trim().toLowerCase());

    await supabase
      .from('question_cache')
      .delete()
      .eq('cache_key', cacheKey);

    console.log('🗑️ Cleared cache:', cacheKey.substring(0, 8));
  } catch (err) {
    console.error('Cache clear error:', err);
  }
}
