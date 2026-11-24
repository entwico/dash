import { describe, expect, it } from 'vitest';

import { createAsyncIterableSubject } from './async-iterable-subject';
import { filterAsync } from './filter-async';
import { mapAsync } from './map-async';

/** A source that stays open, and tells when it was closed. */
function createSource() {
  const subject = createAsyncIterableSubject<number>();
  let closed = 0;

  const source: AsyncIterable<number> = {
    [Symbol.asyncIterator]() {
      const iterator = subject[Symbol.asyncIterator]();

      return {
        next: () => iterator.next(),
        return: async () => {
          closed++;

          return await iterator.return!();
        },
      };
    },
  };

  return { subject, source, closed: () => closed };
}

const derivations = [
  ['mapAsync', (source: AsyncIterable<number>) => mapAsync(source, (value) => value * 10)],
  ['filterAsync', (source: AsyncIterable<number>) => filterAsync(source, (value) => value % 2 === 0)],
] as const;

describe.each(derivations)('%s', (_name, derive) => {
  it('closes the source when the loop over it is left', async () => {
    const { subject, source, closed } = createSource();
    const seen: number[] = [];

    const loop = (async () => {
      for await (const value of derive(source)) {
        seen.push(value);

        break;
      }
    })();

    subject.next(2);
    await loop;

    expect(seen).toHaveLength(1);
    expect(closed()).toBe(1);
  });

  it('closes the source at once when it is closed while it waits for a value', async () => {
    const { source, closed } = createSource();
    const iterator = derive(source)[Symbol.asyncIterator]();
    const waiting = iterator.next();

    await expect(iterator.return!()).resolves.toEqual({ value: undefined, done: true });

    expect(closed()).toBe(1);
    await expect(waiting).resolves.toEqual({ value: undefined, done: true });
    await expect(iterator.next()).resolves.toEqual({ value: undefined, done: true });
  });

  it('answers values that were asked for at once in their order', async () => {
    const { subject, source } = createSource();
    const iterator = derive(source)[Symbol.asyncIterator]();
    const results = Promise.all([iterator.next(), iterator.next()]);

    subject.next(2);
    await new Promise((resolve) => setTimeout(resolve, 5));
    subject.next(4);

    const answered = await results;
    const values = answered.map((result) => result.value as number);

    expect(values[0]).toBeLessThan(values[1]!);
  });

  it('passes on the error of the source, and is done afterwards', async () => {
    const { subject, source, closed } = createSource();
    const iterator = derive(source)[Symbol.asyncIterator]();
    const waiting = iterator.next();

    subject.error(new Error('source failed'));

    await expect(waiting).rejects.toThrow('source failed');
    await expect(iterator.next()).resolves.toEqual({ value: undefined, done: true });
    expect(closed()).toBe(0);
  });

  it('completes with the source', async () => {
    const { subject, source } = createSource();
    const iterator = derive(source)[Symbol.asyncIterator]();
    const waiting = iterator.next();

    subject.complete();

    await expect(waiting).resolves.toEqual({ value: undefined, done: true });
  });
});

describe('a function that throws', () => {
  it.each([
    ['mapAsync', (source: AsyncIterable<number>) => mapAsync(source, () => {
      throw new Error('function failed');
    })],
    ['filterAsync', (source: AsyncIterable<number>) => filterAsync(source, () => {
      throw new Error('function failed');
    })],
  ] as const)('ends %s with its error and closes the source', async (_name, derive) => {
    const { subject, source, closed } = createSource();
    const iterator = derive(source)[Symbol.asyncIterator]();
    const waiting = iterator.next();

    subject.next(1);

    await expect(waiting).rejects.toThrow('function failed');
    expect(closed()).toBe(1);
    await expect(iterator.next()).resolves.toEqual({ value: undefined, done: true });
  });
});
