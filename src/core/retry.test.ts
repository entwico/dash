import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { retry } from './retry';

describe('retry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('ok');

    await expect(retry(fn)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries after the delay and succeeds', async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValue('ok');

    const promise = retry(fn, { retries: 3, delayMs: 1000 });

    await vi.advanceTimersByTimeAsync(1000);

    await expect(promise).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws the last error after exhausting retries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always'));

    const promise = retry(fn, { retries: 3, delayMs: 1000 });
    const assertion = expect(promise).rejects.toThrow('always');

    await vi.advanceTimersByTimeAsync(2000);
    await assertion;

    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('reports every failed attempt via onError', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always'));
    const onError = vi.fn();

    const promise = retry(fn, { retries: 2, delayMs: 10, onError });
    const assertion = expect(promise).rejects.toThrow('always');

    await vi.advanceTimersByTimeAsync(20);
    await assertion;

    expect(onError).toHaveBeenCalledTimes(2);
    expect(onError).toHaveBeenLastCalledWith(expect.any(Error), 2);
  });

  it('rejects when the signal aborts during the delay', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('boom'));
    const controller = new AbortController();

    const promise = retry(fn, { retries: 3, delayMs: 1000, signal: controller.signal });
    const assertion = expect(promise).rejects.toThrow(/aborted/);

    controller.abort(new Error('aborted'));

    await assertion;
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('supports synchronous functions', async () => {
    await expect(retry(() => 42, { retries: 1 })).resolves.toBe(42);
  });
});
