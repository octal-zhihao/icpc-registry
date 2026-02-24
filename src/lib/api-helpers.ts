const DEFAULT_TIMEOUT = 10000; // 10 seconds

export class TimeoutError extends Error {
  constructor(message = 'Request timeout') {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Wraps a promise-like object with a timeout
 */
export function withTimeout<T>(
  promiseLike: PromiseLike<T>,
  timeoutMs: number = DEFAULT_TIMEOUT
): Promise<T> {
  return Promise.race([
    Promise.resolve(promiseLike),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new TimeoutError(`Request timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

/**
 * Fetches with timeout and proper error handling
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError(`Fetch request timed out after ${timeoutMs}ms`);
    }
    throw error;
  }
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
  } = options;

  let lastError: Error | undefined;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * backoffFactor, maxDelay);
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Batch process items with concurrency control
 */
export async function batchProcess<T, R>(
  items: T[],
  processFn: (item: T, index: number) => Promise<R>,
  options: {
    concurrency?: number;
    onProgress?: (completed: number, total: number, failed: number) => void;
  } = {}
): Promise<{ results: R[]; errors: Array<{ index: number; error: Error }> }> {
  const { concurrency = 5, onProgress } = options;
  const results: R[] = [];
  const errors: Array<{ index: number; error: Error }> = [];

  let completed = 0;
  let failed = 0;

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchPromises = batch.map((item, batchIndex) => {
      const itemIndex = i + batchIndex;
      return processFn(item, itemIndex)
        .then(result => {
          results[itemIndex] = result;
          completed++;
          onProgress?.(completed, items.length, failed);
          return result;
        })
        .catch(error => {
          errors.push({ index: itemIndex, error });
          failed++;
          onProgress?.(completed, items.length, failed);
          return null;
        });
    });

    await Promise.allSettled(batchPromises);
  }

  return { results, errors };
}
