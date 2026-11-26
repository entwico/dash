/**
 * An iterable that derives its values from `source` one by one: `derive` answers with the value to
 * yield, or with `undefined` to skip it. Not part of the package API — `mapAsync` and `filterAsync`
 * are built on it.
 *
 * Written by hand instead of as an async generator: a generator that waits for its source cannot
 * be closed until the source yields, so closing it would leave the source open, and whoever waits
 * for the next value waiting, for as long as the source has nothing to say.
 */
export function deriveAsync<T, R>(
  source: AsyncIterable<T>,
  derive: (value: T) => { value: R } | undefined,
): AsyncIterable<R> {
  return {
    [Symbol.asyncIterator](): AsyncIterator<R> {
      const iterator = source[Symbol.asyncIterator]();
      const doneResult: IteratorResult<R> = { value: undefined, done: true };

      let finished = false;
      let stopWaiting: (() => void) | undefined;
      let queue: Promise<void> = Promise.resolve();

      /** The next result of the source, or `undefined` once this iterator is closed. */
      const nextUnlessClosed = (): Promise<IteratorResult<T> | undefined> =>
        new Promise((resolve, reject) => {
          stopWaiting = () => resolve(undefined);

          void (async () => {
            try {
              resolve(await iterator.next());
            } catch (error) {
              reject(error);
            } finally {
              stopWaiting = undefined;
            }
          })();
        });

      const pull = async (): Promise<IteratorResult<R>> => {
        while (!finished) {
          let result: IteratorResult<T> | undefined;

          try {
            result = await nextUnlessClosed();
          } catch (error) {
            finished = true;

            throw error;
          }

          if (!result || result.done === true) {
            finished = true;

            return doneResult;
          }

          let derived: { value: R } | undefined;

          try {
            derived = derive(result.value);
          } catch (error) {
            finished = true;
            void iterator.return?.();

            throw error;
          }

          if (derived) {
            return { value: derived.value, done: false };
          }
        }

        return doneResult;
      };

      return {
        next(): Promise<IteratorResult<R>> {
          const previous = queue;

          const result = (async () => {
            await previous;

            return await pull();
          })();

          queue = (async () => {
            try {
              await result;
            } catch {
              // the caller of that pull has the error
            }
          })();

          return result;
        },
        return(): Promise<IteratorResult<R>> {
          if (!finished) {
            finished = true;
            stopWaiting?.();
            void iterator.return?.();
          }

          return Promise.resolve(doneResult);
        },
      };
    },
  };
}
