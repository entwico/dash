import { describe, expect, it, vi } from 'vitest';

import { createAsyncIterableSubject } from './async-iterable-subject';
import { debounceAsync } from './debounce-async';

describe('debounceAsync', () => {
  it('yields the latest value after ms of silence, restarting the window on each emission', async () => {
    vi.useFakeTimers();

    try {
      const source = createAsyncIterableSubject<string>();
      const out: string[] = [];

      const done = (async () => {
        for await (const value of debounceAsync(source, 100)) {
          out.push(value);
        }
      })();

      source.next('a');

      await vi.advanceTimersByTimeAsync(50);

      source.next('b');

      await vi.advanceTimersByTimeAsync(99);

      expect(out).toEqual([]);

      await vi.advanceTimersByTimeAsync(1);

      expect(out).toEqual(['b']);

      source.complete();

      await done;

      expect(out).toEqual(['b']);
    } finally {
      vi.useRealTimers();
    }
  });

  it('flushes the trailing value on source completion', async () => {
    vi.useFakeTimers();

    try {
      const source = createAsyncIterableSubject<string>();
      const out: string[] = [];

      const done = (async () => {
        for await (const value of debounceAsync(source, 100)) {
          out.push(value);
        }
      })();

      source.next('a');

      await vi.advanceTimersByTimeAsync(0);

      source.complete();

      await done;

      expect(out).toEqual(['a']);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('a slow consumer only sees the most recent settled value', async () => {
    vi.useFakeTimers();

    try {
      const source = createAsyncIterableSubject<string>();
      const iterator = debounceAsync(source, 100)[Symbol.asyncIterator]();

      source.next('a');

      await vi.advanceTimersByTimeAsync(100);

      source.next('b');

      await vi.advanceTimersByTimeAsync(100);

      await expect(iterator.next()).resolves.toEqual({ value: 'b', done: false });

      await iterator.return!();
    } finally {
      vi.useRealTimers();
    }
  });

  it('propagates source errors, dropping a value still debouncing', async () => {
    vi.useFakeTimers();

    try {
      const source = createAsyncIterableSubject<string>();
      const out: string[] = [];

      const done = (async () => {
        for await (const value of debounceAsync(source, 100)) {
          out.push(value);
        }
      })();

      source.next('a');

      await vi.advanceTimersByTimeAsync(0);

      source.error(new Error('boom'));

      await expect(done).rejects.toThrow('boom');

      expect(out).toEqual([]);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('clears the timer when the consumer breaks', async () => {
    vi.useFakeTimers();

    try {
      const source = createAsyncIterableSubject<string>();
      const out: string[] = [];

      const done = (async () => {
        for await (const value of debounceAsync(source, 100)) {
          out.push(value);
          break;
        }
      })();

      source.next('a');

      await vi.advanceTimersByTimeAsync(100);

      await done;

      source.next('b');

      await vi.advanceTimersByTimeAsync(1000);

      expect(out).toEqual(['a']);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('debounceAsync after its source failed', () => {
  it('rejects every later next() with the error', async () => {
    const source = createAsyncIterableSubject<string>();
    const iterator = debounceAsync(source, 10)[Symbol.asyncIterator]();
    const waiting = iterator.next();

    source.error(new Error('boom'));

    await expect(waiting).rejects.toThrow('boom');
    await expect(iterator.next()).rejects.toThrow('boom');
  });

  it('rejects the first next() when the source failed before anyone asked', async () => {
    const source = createAsyncIterableSubject<string>();
    const iterator = debounceAsync(source, 10)[Symbol.asyncIterator]();

    source.error(new Error('boom'));
    await new Promise((resolve) => setTimeout(resolve));

    await expect(iterator.next()).rejects.toThrow('boom');
  });

  it('ignores a source that fails after the consumer left', async () => {
    let fail: (error: Error) => void = () => {};

    const source: AsyncIterable<string> = {
      [Symbol.asyncIterator]: () => ({
        next: () => new Promise<IteratorResult<string>>((_resolve, reject) => void (fail = reject)),
      }),
    };

    const iterator = debounceAsync(source, 10)[Symbol.asyncIterator]();
    const waiting = iterator.next();

    await iterator.return!();
    fail(new Error('late'));
    await new Promise((resolve) => setTimeout(resolve));

    await expect(waiting).resolves.toEqual({ value: undefined, done: true });
    await expect(iterator.next()).resolves.toEqual({ value: undefined, done: true });
  });
});
