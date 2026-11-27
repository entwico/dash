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

describe('mergeAsync after a source failed', () => {
  it('hands out the values it had buffered, then rejects every later next()', async () => {
    const a = createAsyncIterableSubject<number>();
    const iterator = mergeAsync([a])[Symbol.asyncIterator]();

    a.next(1);
    await tick();
    a.error(new Error('boom'));
    await tick();

    await expect(iterator.next()).resolves.toEqual({ value: 1, done: false });
    await expect(iterator.next()).rejects.toThrow('boom');
    await expect(iterator.next()).rejects.toThrow('boom');
  });

  it('keeps the first error when another source fails as well', async () => {
    const a = createAsyncIterableSubject<number>();
    const b = createAsyncIterableSubject<number>();
    const iterator = mergeAsync([a, b])[Symbol.asyncIterator]();
    const waiting = iterator.next();

    a.error(new Error('first'));
    b.error(new Error('second'));

    await expect(waiting).rejects.toThrow('first');
    await expect(iterator.next()).rejects.toThrow('first');
  });

  it('ignores a source that fails after the consumer left', async () => {
    let fail: (error: Error) => void = () => {};

    const source: AsyncIterable<number> = {
      [Symbol.asyncIterator]: () => ({
        next: () => new Promise<IteratorResult<number>>((_resolve, reject) => void (fail = reject)),
      }),
    };

    const iterator = mergeAsync([source])[Symbol.asyncIterator]();
    const waiting = iterator.next();

    await iterator.return!();
    fail(new Error('late'));
    await tick();

    await expect(waiting).resolves.toEqual({ value: undefined, done: true });
    await expect(iterator.next()).resolves.toEqual({ value: undefined, done: true });
  });
});
