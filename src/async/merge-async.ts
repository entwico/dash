/**
 * Merges multiple `AsyncIterable`s into one, yielding values from all sources as they arrive
 * (≈ rxjs `merge`). Completes once every source has completed; errors as soon as any source
 * errors, closing the remaining sources. Disposing the merged iterator (`break`, `return()`)
 * closes all sources.
 *
 * Values arriving while the consumer is busy are buffered unboundedly — intended for
 * low-frequency events.
 */
export function mergeAsync<T>(sources: readonly AsyncIterable<T>[]): AsyncIterable<T> {
  return {
    [Symbol.asyncIterator](): AsyncIterator<T> {
      const iterators = sources.map((source) => source[Symbol.asyncIterator]());
      const queue: T[] = [];
      const doneResult: IteratorResult<T> = { value: undefined, done: true };

      let active = iterators.length;
      let failure: { error: unknown } | undefined;
      let closed = false;
      let pending: { resolve: (result: IteratorResult<T>) => void; reject: (error: unknown) => void } | undefined;

      const consume = async (iterator: AsyncIterator<T>): Promise<void> => {
        try {
          for (;;) {
            const result = await iterator.next();

            if (closed) {
              return;
            }

            if (result.done === true) {
              active--;

              if (active === 0 && pending) {
                const p = pending;

                pending = undefined;
                p.resolve(doneResult);
              }

              return;
            }

            if (pending) {
              const p = pending;

              pending = undefined;
              p.resolve({ value: result.value, done: false });
            } else {
              queue.push(result.value);
            }
          }
        } catch (error) {
          if (closed || failure) {
            return;
          }

          failure = { error };

          for (const other of iterators) {
            if (other !== iterator) {
              void other.return?.();
            }
          }

          if (pending) {
            const p = pending;

            pending = undefined;
            p.reject(error);
          }
        }
      };

      for (const iterator of iterators) {
        void consume(iterator);
      }

      return {
        next(): Promise<IteratorResult<T>> {
          if (queue.length > 0) {
            return Promise.resolve({ value: queue.shift()!, done: false });
          }

          if (failure) {
            return Promise.reject(failure.error);
          }

          if (closed || active === 0) {
            return Promise.resolve(doneResult);
          }

          return new Promise((resolve, reject) => {
            pending = { resolve, reject };
          });
        },
        return(): Promise<IteratorResult<T>> {
          closed = true;

          for (const iterator of iterators) {
            void iterator.return?.();
          }

          if (pending) {
            const p = pending;

            pending = undefined;
            p.resolve(doneResult);
          }

          return Promise.resolve(doneResult);
        },
      };
    },
  };
}
