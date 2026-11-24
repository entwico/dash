import { type BackoffOptions, exponentialBackoff } from './backoff';

/**
 * The next result of `iterator`, or `undefined` once `signal` aborts. The abort listener is removed
 * with every result: a signal lives as long as the stream, and would keep every result it raced.
 */
function nextUnlessAborted<T>(
  iterator: AsyncIterator<T>,
  signal: AbortSignal | undefined,
): Promise<IteratorResult<T> | undefined> {
  if (!signal) {
    return iterator.next();
  }

  return new Promise((resolve, reject) => {
    const onAbort = () => resolve(undefined);

    signal.addEventListener('abort', onAbort, { once: true });

    void (async () => {
      try {
        resolve(await iterator.next());
      } catch (error) {
        reject(error);
      } finally {
        signal.removeEventListener('abort', onAbort);
      }
    })();
  });
}

/**
 * The values of `source` until it completes or `signal` aborts. A source with nothing to say would
 * otherwise hold the stream open past the abort, so one that is still open then is closed.
 */
async function* readUnlessAborted<T>(source: AsyncIterable<T>, signal: AbortSignal | undefined): AsyncIterable<T> {
  const iterator = source[Symbol.asyncIterator]();
  let open = true;

  try {
    for (;;) {
      const result = await nextUnlessAborted(iterator, signal);

      if (!result) {
        return;
      }

      if (result.done === true) {
        open = false;

        return;
      }

      yield result.value;
    }
  } catch (error) {
    open = false;

    throw error;
  } finally {
    if (open) {
      void iterator.return?.();
    }
  }
}

/**
 * Long-running stream wrapper: subscribes via `factory()`, yields every value, and on error or
 * unexpected completion re-subscribes with exponential backoff. Stops only when `options.signal`
 * aborts, closing the source it is subscribed to. Designed for subscriptions that should stay open
 * across reconnects.
 */
export async function* keepalive<T>(
  factory: () => AsyncIterable<T>,
  options?: BackoffOptions | undefined,
): AsyncIterable<T> {
  let attempt = 0;
  const signal = options?.signal;

  while (!signal?.aborted) {
    try {
      for await (const value of readUnlessAborted(factory(), signal)) {
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

      try {
        await exponentialBackoff(attempt, options);
      } catch {
        // the wait fails only when the signal aborts it
        return;
      }

      attempt++;
    }
  }
}
