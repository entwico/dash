import { type BackoffOptions, exponentialBackoff } from './backoff';

/**
 * Long-running stream wrapper: subscribes via `factory()`, yields every value, and on error or
 * unexpected completion re-subscribes with exponential backoff. Stops only when `options.signal`
 * aborts. Designed for subscriptions that should stay open across reconnects.
 */
export async function* keepalive<T>(
  factory: () => AsyncIterable<T>,
  options?: BackoffOptions | undefined,
): AsyncIterable<T> {
  let attempt = 0;
  const signal = options?.signal;

  while (!signal?.aborted) {
    try {
      for await (const value of factory()) {
        if (signal?.aborted) {
          return;
        }

        yield value;
        attempt = 0;
      }

      // source completed cleanly — re-subscribe immediately
      attempt = 0;
    } catch (error) {
      if (signal?.aborted) {
        return;
      }

      // swallow + back off, then retry. callers that want the error to surface should not use keepalive
      void error;
      await exponentialBackoff(attempt, options);
      attempt++;
    }
  }
}
