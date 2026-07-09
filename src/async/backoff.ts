import { sleep } from '../core/sleep';

const DEFAULT_MAX_DELAY_MS = 30_000;
const DEFAULT_JITTER_MIN_MS = 300;
const DEFAULT_JITTER_MAX_MS = 3000;

export type BackoffOptions = {
  /** upper bound for the exponential delay, before jitter (default 30_000) */
  maxDelayMs?: number | undefined;

  /** lower bound of the random jitter added to every delay (default 300) */
  jitterMinMs?: number | undefined;

  /** upper bound of the random jitter added to every delay (default 3000) */
  jitterMaxMs?: number | undefined;

  /** aborts the backoff wait (and, where applicable, the retry loop) */
  signal?: AbortSignal | undefined;
};

/**
 * Exponential backoff with jitter. `attempt` starts at 0 → ~1s+jitter, 1 → ~2s+jitter, etc.,
 * capped at `maxDelayMs`. Returns a Promise that resolves after the delay.
 */
export function exponentialBackoff(attempt: number, options?: BackoffOptions | undefined): Promise<void> {
  const maxDelayMs = options?.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
  const jitterMinMs = options?.jitterMinMs ?? DEFAULT_JITTER_MIN_MS;
  const jitterMaxMs = options?.jitterMaxMs ?? DEFAULT_JITTER_MAX_MS;

  const base = Math.min(Math.pow(2, attempt) * 1000, maxDelayMs);
  const jitter = Math.floor(Math.random() * (jitterMaxMs - jitterMinMs) + jitterMinMs);

  return sleep(base + jitter, options?.signal);
}

/**
 * Runs `fn` with exponential-backoff retry on rejection, indefinitely, resolving with the first
 * successful result. `options.signal` aborts both the in-flight `fn` (if it observes the signal)
 * and the backoff wait.
 */
export async function retryWithBackoff<T>(fn: () => Promise<T>, options?: BackoffOptions | undefined): Promise<T> {
  let attempt = 0;

  for (;;) {
    if (options?.signal?.aborted) {
      throw options.signal.reason;
    }

    try {
      return await fn();
    } catch {
      await exponentialBackoff(attempt, options);
      attempt++;
    }
  }
}
