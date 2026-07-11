/**
 * Rolling debounce over an `AsyncIterable` (≈ rxjs `debounceTime`): yields the most recent value
 * once `ms` elapses without a new one. On source completion the trailing value is flushed before
 * completing; source errors propagate immediately, dropping any value still debouncing.
 *
 * Backpressure: values settling while the consumer is busy replace the unclaimed one, so a pull
 * always yields only the single most recent settled value. Disposing the iterator clears the
 * timer and closes the source.
 */
export function debounceAsync<T>(source: AsyncIterable<T>, ms: number): AsyncIterable<T> {
  return {
    [Symbol.asyncIterator](): AsyncIterator<T> {
      const iterator = source[Symbol.asyncIterator]();
      const doneResult: IteratorResult<T> = { value: undefined, done: true };

      let timer: ReturnType<typeof setTimeout> | undefined;
      let debouncing: { value: T } | undefined;
      let ready: { value: T } | undefined;
      let finished = false;
      let failure: { error: unknown } | undefined;
      let closed = false;
      let pending: { resolve: (result: IteratorResult<T>) => void; reject: (error: unknown) => void } | undefined;

      const settle = (): void => {
        timer = undefined;

        if (!debouncing) {
          return;
        }

        if (pending) {
          const p = pending;

          pending = undefined;
          p.resolve({ value: debouncing.value, done: false });
        } else {
          ready = debouncing;
        }

        debouncing = undefined;
      };

      void (async () => {
        try {
          for (;;) {
            const result = await iterator.next();

            if (closed) {
              return;
            }

            if (result.done === true) {
              finished = true;

              clearTimeout(timer);
              settle();

              if (pending) {
                const p = pending;

                pending = undefined;
                p.resolve(doneResult);
              }

              return;
            }

            debouncing = { value: result.value };

            clearTimeout(timer);
            timer = setTimeout(settle, ms);
          }
        } catch (error) {
          if (closed) {
            return;
          }

          failure = { error };

          clearTimeout(timer);

          if (pending) {
            const p = pending;

            pending = undefined;
            p.reject(error);
          }
        }
      })();

      return {
        next(): Promise<IteratorResult<T>> {
          if (ready) {
            const { value } = ready;

            ready = undefined;

            return Promise.resolve({ value, done: false });
          }

          if (failure) {
            return Promise.reject(failure.error);
          }

          if (closed || finished) {
            return Promise.resolve(doneResult);
          }

          return new Promise((resolve, reject) => {
            pending = { resolve, reject };
          });
        },
        return(): Promise<IteratorResult<T>> {
          closed = true;

          clearTimeout(timer);

          if (pending) {
            const p = pending;

            pending = undefined;
            p.resolve(doneResult);
          }

          void iterator.return?.();

          return Promise.resolve(doneResult);
        },
      };
    },
  };
}
