import { describe, expect, it } from 'vitest';

import { createAsyncIterableSubject } from './async-iterable-subject';
import { mergeAsync } from './merge-async';

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve));

function closableSource<T>(): { source: AsyncIterable<T>; isClosed: () => boolean } {
  let closed = false;

  return {
    source: {
      [Symbol.asyncIterator]: () => ({
        next: () => new Promise<IteratorResult<T>>(() => {}),
        return: () => {
          closed = true;

          return Promise.resolve({ value: undefined, done: true });
        },
      }),
    },
    isClosed: () => closed,
  };
}

describe('mergeAsync', () => {
  it('yields values from all sources and completes once all complete', async () => {
    const a = createAsyncIterableSubject<number>();
    const b = createAsyncIterableSubject<number>();
    const out: number[] = [];

    const merged = mergeAsync([a, b]);

    const done = (async () => {
      for await (const value of merged) {
        out.push(value);
      }
    })();

    a.next(1);
    await tick();
    b.next(2);
    await tick();
    a.next(3);
    await tick();
    a.complete();
    b.next(4);
    await tick();
    b.complete();

    await done;

    expect(out).toEqual([1, 2, 3, 4]);
  });

  it('completes immediately with no sources', async () => {
    await expect(Array.fromAsync(mergeAsync([]))).resolves.toEqual([]);
  });

  it('errors when any source errors and closes the others', async () => {
    const a = createAsyncIterableSubject<number>();
    const { source: b, isClosed } = closableSource<number>();
    const out: number[] = [];

    const merged = mergeAsync([a, b]);

    const done = (async () => {
      for await (const value of merged) {
        out.push(value);
      }
    })();

    a.next(1);
    await tick();
    a.error(new Error('boom'));

    await expect(done).rejects.toThrow('boom');

    expect(out).toEqual([1]);
    expect(isClosed()).toBe(true);
  });

  it('closes all sources when the consumer breaks', async () => {
    const a = createAsyncIterableSubject<number>();
    const { source: b, isClosed } = closableSource<number>();
    const out: number[] = [];

    const merged = mergeAsync([a, b]);

    const done = (async () => {
      for await (const value of merged) {
        out.push(value);
        break;
      }
    })();

    a.next(1);

    await done;

    expect(out).toEqual([1]);
    expect(isClosed()).toBe(true);
  });

  it('buffers values while the consumer is busy', async () => {
    const a = createAsyncIterableSubject<number>();
    const iterator = mergeAsync([a])[Symbol.asyncIterator]();

    a.next(1);
    a.next(2);
    await tick();

    await expect(iterator.next()).resolves.toEqual({ value: 1, done: false });
    await expect(iterator.next()).resolves.toEqual({ value: 2, done: false });

    await iterator.return!();
  });
});
