import { describe, expect, it, vi } from 'vitest';

import { createAsyncIterableSubject } from './async-iterable-subject';

describe('createAsyncIterableSubject', () => {
  it('observer subscribe receives next/complete and is detached by the returned unsubscribe', () => {
    const s = createAsyncIterableSubject<number>();
    const got: number[] = [];

    const unsub = s.subscribe({
      next: (v) => {
        got.push(v);
      },
    });

    s.next(1);
    s.next(2);
    unsub();
    s.next(3);

    expect(got).toEqual([1, 2]);
  });

  it('multiple observers fan out from the same source', () => {
    const s = createAsyncIterableSubject<number>();
    const a: number[] = [];
    const b: number[] = [];

    s.subscribe({
      next: (v) => {
        a.push(v);
      },
    });
    s.subscribe({
      next: (v) => {
        b.push(v);
      },
    });

    s.next(1);
    s.next(2);

    expect(a).toEqual([1, 2]);
    expect(b).toEqual([1, 2]);
  });

  it('async iterator yields queued values pushed before iteration started', async () => {
    const s = createAsyncIterableSubject<number>();
    const got: number[] = [];

    const done = (async () => {
      for await (const v of s) {
        got.push(v);

        if (v === 3) {
          break;
        }
      }
    })();

    s.next(1);
    s.next(2);
    s.next(3);

    await done;

    expect(got).toEqual([1, 2, 3]);
  });

  it('two for-await consumers get independent iterators', async () => {
    const s = createAsyncIterableSubject<number>();
    const a: number[] = [];
    const b: number[] = [];

    const aDone = (async () => {
      for await (const v of s) {
        a.push(v);
        if (v === 2) break;
      }
    })();

    const bDone = (async () => {
      for await (const v of s) {
        b.push(v);
        if (v === 2) break;
      }
    })();

    s.next(1);
    s.next(2);

    await Promise.all([aDone, bDone]);

    expect(a).toEqual([1, 2]);
    expect(b).toEqual([1, 2]);
  });

  it('complete() releases pending iterators and notifies listeners', async () => {
    const s = createAsyncIterableSubject<number>();
    const completed = vi.fn();
    const nextCb = vi.fn();

    s.subscribe({ next: nextCb, complete: completed });

    const iterDone = (async () => {
      for await (const _v of s) {
        // pending: complete will resolve done: true
      }
    })();

    s.complete();
    await iterDone;

    expect(completed).toHaveBeenCalledTimes(1);
    // post-complete calls are dropped
    s.next(999);
    expect(nextCb).not.toHaveBeenCalled();
  });

  it('error(err) rejects pending iterators and notifies listeners', async () => {
    const s = createAsyncIterableSubject<number>();
    const errored = vi.fn();
    const boom = new Error('boom');

    s.subscribe({ error: errored });

    const iterPromise = (async () => {
      for await (const _v of s) {
        // pending
      }
    })();

    s.error(boom);

    await expect(iterPromise).rejects.toThrow('boom');
    expect(errored).toHaveBeenCalledWith(boom);

    // post-error calls are dropped
    s.next(123);
  });

  it('subscribing after complete returns a no-op unsubscribe and never fires', () => {
    const s = createAsyncIterableSubject<number>();

    s.complete();

    const next = vi.fn();
    const unsub = s.subscribe({ next });

    s.next(1);

    expect(next).not.toHaveBeenCalled();
    expect(() => unsub()).not.toThrow();
  });

  it('iterating after error rejects immediately', async () => {
    const s = createAsyncIterableSubject<number>();

    s.error(new Error('boom'));

    const iter = s[Symbol.asyncIterator]();

    await expect(iter.next()).rejects.toThrow('boom');
  });
});
