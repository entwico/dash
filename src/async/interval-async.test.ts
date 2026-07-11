import { describe, expect, it, vi } from 'vitest';

import { intervalAsync } from './interval-async';

describe('intervalAsync', () => {
  it('yields incrementing ticks, the first after one full period', async () => {
    vi.useFakeTimers();

    try {
      const out: number[] = [];

      const done = (async () => {
        for await (const tick of intervalAsync(1000)) {
          out.push(tick);

          if (tick === 2) {
            break;
          }
        }
      })();

      await vi.advanceTimersByTimeAsync(999);

      expect(out).toEqual([]);

      await vi.advanceTimersByTimeAsync(1);

      expect(out).toEqual([0]);

      await vi.advanceTimersByTimeAsync(2000);

      expect(out).toEqual([0, 1, 2]);

      await done;

      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('return() settles a pending next as done and clears the timer', async () => {
    vi.useFakeTimers();

    try {
      const iterator = intervalAsync(1000)[Symbol.asyncIterator]();
      const pending = iterator.next();

      await expect(iterator.return!()).resolves.toEqual(expect.objectContaining({ done: true }));
      await expect(pending).resolves.toEqual(expect.objectContaining({ done: true }));
      await expect(iterator.next()).resolves.toEqual(expect.objectContaining({ done: true }));

      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('each iteration ticks independently', async () => {
    vi.useFakeTimers();

    try {
      const source = intervalAsync(1000);
      const a = source[Symbol.asyncIterator]();

      await vi.advanceTimersByTimeAsync(0);

      const first = a.next();

      await vi.advanceTimersByTimeAsync(1000);

      await expect(first).resolves.toEqual({ value: 0, done: false });

      const b = source[Symbol.asyncIterator]();
      const second = b.next();

      await vi.advanceTimersByTimeAsync(1000);

      await expect(second).resolves.toEqual({ value: 0, done: false });

      await a.return!();
      await b.return!();
    } finally {
      vi.useRealTimers();
    }
  });
});
