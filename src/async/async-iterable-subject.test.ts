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

describe('a subject that has ended', () => {
  it('is done at once for an iterator taken after complete', async () => {
    const s = createAsyncIterableSubject<number>();

    s.complete();

    const iter = s[Symbol.asyncIterator]();

    await expect(iter.next()).resolves.toEqual({ value: undefined, done: true });
    await expect(iter.return!()).resolves.toEqual({ value: undefined, done: true });
  });

  it('lets an iterator taken after error be closed', async () => {
    const s = createAsyncIterableSubject<number>();

    s.error(new Error('boom'));

    await expect(s[Symbol.asyncIterator]().return!()).resolves.toEqual({ value: undefined, done: true });
  });

  it('hands an iterator the values it had not read before complete, then is done', async () => {
    const s = createAsyncIterableSubject<number>();
    const iter = s[Symbol.asyncIterator]();

    s.next(1);
    s.next(2);
    s.complete();

    await expect(iter.next()).resolves.toEqual({ value: 1, done: false });
    await expect(iter.next()).resolves.toEqual({ value: 2, done: false });
    await expect(iter.next()).resolves.toEqual({ value: undefined, done: true });
  });

  it('hands an iterator the values it had not read before error, then rejects', async () => {
    const s = createAsyncIterableSubject<number>();
    const iter = s[Symbol.asyncIterator]();

    s.next(1);
    s.error(new Error('boom'));

    await expect(iter.next()).resolves.toEqual({ value: 1, done: false });
    await expect(iter.next()).rejects.toThrow('boom');
  });

  it('drops whatever is sent after it ended', () => {
    const completed = createAsyncIterableSubject<number>();
    const failed = createAsyncIterableSubject<number>();
    const observer = { next: vi.fn(), error: vi.fn(), complete: vi.fn() };

    completed.subscribe(observer);
    failed.subscribe(observer);

    completed.complete();
    completed.next(1);
    completed.error(new Error('late'));
    completed.complete();

    failed.error(new Error('boom'));
    failed.next(1);
    failed.complete();
    failed.error(new Error('late'));

    expect(observer.next).not.toHaveBeenCalled();
    expect(observer.complete).toHaveBeenCalledTimes(1);
    expect(observer.error).toHaveBeenCalledTimes(1);
  });
});

describe('an iterator that is closed by hand', () => {
  it('ends a next() that was waiting, and takes no later value', async () => {
    const s = createAsyncIterableSubject<number>();
    const iter = s[Symbol.asyncIterator]();
    const waiting = iter.next();

    await expect(iter.return!()).resolves.toEqual({ value: undefined, done: true });
    await expect(waiting).resolves.toEqual({ value: undefined, done: true });

    s.next(1);
    s.complete();

    await expect(iter.next()).resolves.toEqual({ value: undefined, done: true });
  });

  it('rejects throw() with the error it was given, and takes no later value', async () => {
    const s = createAsyncIterableSubject<number>();
    const iter = s[Symbol.asyncIterator]();

    await expect(iter.throw!(new Error('thrown'))).rejects.toThrow('thrown');

    s.next(1);
    s.complete();

    await expect(iter.next()).resolves.toEqual({ value: undefined, done: true });
  });
});
