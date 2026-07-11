/**
 * Periodic tick stream: yields 0, 1, 2, … every `ms`, first tick after one full period
 * (≈ rxjs `interval`). Each iteration gets its own independent timer. Disposing the iterator
 * (`break` out of `for await`, or `iterator.return()`) clears the pending timer immediately.
 */
export function intervalAsync(ms: number): AsyncIterable<number> {
  return {
    [Symbol.asyncIterator](): AsyncIterator<number> {
      let tick = 0;
      let done = false;
      let timer: ReturnType<typeof setTimeout> | undefined;
      let pending: ((result: IteratorResult<number>) => void) | undefined;

      return {
        next(): Promise<IteratorResult<number>> {
          if (done) {
            return Promise.resolve({ value: undefined, done: true });
          }

          return new Promise((resolve) => {
            pending = resolve;

            timer = setTimeout(() => {
              pending = undefined;
              resolve({ value: tick++, done: false });
            }, ms);
          });
        },
        return(): Promise<IteratorResult<number>> {
          done = true;

          clearTimeout(timer);
          pending?.({ value: undefined, done: true });
          pending = undefined;

          return Promise.resolve({ value: undefined, done: true });
        },
      };
    },
  };
}
