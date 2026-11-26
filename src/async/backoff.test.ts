import { describe, expect, it, vi } from 'vitest';

import { exponentialBackoff, retryWithBackoff } from './backoff';

describe('exponentialBackoff', () => {
  it('resolves once the delay of the attempt has passed', async () => {
    vi.useFakeTimers();

    try {
      const p = exponentialBackoff(0);

      vi.advanceTimersByTime(60_000);

      await expect(p).resolves.toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it('caps the delay at maxDelayMs plus jitter', async () => {
    vi.useFakeTimers();

    try {
      const p = exponentialBackoff(10, { maxDelayMs: 50, jitterMinMs: 0, jitterMaxMs: 1 });

      vi.advanceTimersByTime(60);

      await expect(p).resolves.toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it('rejects when the signal aborts during the wait', async () => {
    vi.useFakeTimers();

    try {
      const controller = new AbortController();
      const p = exponentialBackoff(0, { signal: controller.signal });

      controller.abort(new Error('aborted'));

      await expect(p).rejects.toThrow(/aborted/);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('retryWithBackoff', () => {
  it('returns once `fn` resolves on the first attempt', async () => {
    const fn = vi.fn().mockResolvedValue(undefined);

    await retryWithBackoff(fn);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on rejection until success', async () => {
    vi.useFakeTimers();

    try {
      const fn = vi
        .fn<() => Promise<unknown>>()
        .mockRejectedValueOnce(new Error('boom'))
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValueOnce('ok');

      const promise = retryWithBackoff(fn);

      // drain all pending microtasks + timers so the backoff resolves immediately
      for (let i = 0; i < 20 && fn.mock.calls.length < 3; i++) {
        await vi.advanceTimersByTimeAsync(60_000);
      }

      await promise;

      expect(fn).toHaveBeenCalledTimes(3);
    } finally {
      vi.useRealTimers();
    }
  });

  it('throws when the signal aborts', async () => {
    const controller = new AbortController();

    controller.abort(new Error('aborted'));

    await expect(retryWithBackoff(async () => {}, { signal: controller.signal })).rejects.toThrow(/aborted/);
  });
});
