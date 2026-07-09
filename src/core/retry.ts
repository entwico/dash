import { sleep } from './sleep';

export type RetryOptions = {
  /** total number of attempts before the last error is rethrown (default 3) */
  retries?: number | undefined;

  /** fixed delay between attempts (default 1000) */
  delayMs?: number | undefined;

  /** aborts the delay between attempts */
  signal?: AbortSignal | undefined;

  /** called after every failed attempt with the error and the 1-based attempt number */
  onError?: ((error: unknown, attempt: number) => void) | undefined;
};

/**
 * Runs `fn`, retrying with a fixed delay on failure. Resolves with the first successful result;
 * rethrows the last error once the attempts are exhausted.
 */
export async function retry<T>(fn: () => T, options?: RetryOptions | undefined): Promise<T> {
  const retries = options?.retries ?? 3;
  const delayMs = options?.delayMs ?? 1000;

  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      options?.onError?.(error, attempt);

      if (attempt >= retries) {
        throw error;
      }

      await sleep(delayMs, options?.signal);
    }
  }
}
