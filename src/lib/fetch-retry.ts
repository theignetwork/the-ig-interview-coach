/**
 * Fetch with automatic retry logic and exponential backoff
 * Makes API calls more reliable by retrying failed requests
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2, // Double the delay each time
  onRetry: () => {}, // No-op by default
};

/**
 * Fetch with retry logic
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param retryOptions - Retry configuration
 * @returns Response promise
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const config = { ...DEFAULT_OPTIONS, ...retryOptions };
  let lastError: Error;
  let delay = config.initialDelay;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // If successful (2xx), return immediately
      if (response.ok) {
        if (attempt > 0) {
          console.log(`✅ Request succeeded after ${attempt} ${attempt === 1 ? 'retry' : 'retries'}`);
        }
        return response;
      }

      // If 4xx client error (except 429 rate limit), don't retry
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        console.warn(`❌ Client error ${response.status}, not retrying`);
        return response; // Return the error response
      }

      // If 5xx server error or 429 rate limit, retry
      throw new Error(`Server error: ${response.status}`);
    } catch (error) {
      lastError = error as Error;

      // Don't retry on last attempt
      if (attempt === config.maxRetries) {
        console.error(`❌ Request failed after ${config.maxRetries} retries:`, lastError.message);
        break;
      }

      // Call retry callback
      config.onRetry(attempt + 1, lastError);

      // Log retry attempt
      console.log(`⚠️ Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);

      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, delay));

      // Increase delay for next retry, up to maxDelay
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
    }
  }

  // If we get here, all retries failed
  throw new Error(
    `Request failed after ${config.maxRetries} ${config.maxRetries === 1 ? 'retry' : 'retries'}: ${lastError!.message}`
  );
}

/**
 * Convenience wrapper for JSON API calls with retry
 * Automatically parses JSON response and includes Content-Type header
 */
export async function fetchJSONWithRetry<T = any>(
  url: string,
  data?: any,
  retryOptions?: RetryOptions
): Promise<T> {
  const options: RequestInit = {
    method: data ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetchWithRetry(url, options, retryOptions);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  return await response.json();
}
