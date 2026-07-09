import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createBatcher } from './create-batcher';

describe('createBatcher', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('flushes buffered items together after the delay', () => {
    const onFlush = vi.fn();
    const add = createBatcher<number>(onFlush, 50);

    add(1);
    add(2);
    add(3);

    expect(onFlush).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);

    expect(onFlush).toHaveBeenCalledTimes(1);
    expect(onFlush).toHaveBeenCalledWith([1, 2, 3]);
  });

  it('starts a fresh buffer after a flush', () => {
    const onFlush = vi.fn();
    const add = createBatcher<number>(onFlush, 50);

    add(1);
    vi.advanceTimersByTime(50);

    add(2);
    vi.advanceTimersByTime(50);

    expect(onFlush).toHaveBeenNthCalledWith(1, [1]);
    expect(onFlush).toHaveBeenNthCalledWith(2, [2]);
  });

  it('resets the delay on every added item', () => {
    const onFlush = vi.fn();
    const add = createBatcher<number>(onFlush, 50);

    add(1);
    vi.advanceTimersByTime(30);

    add(2);
    vi.advanceTimersByTime(30);

    expect(onFlush).not.toHaveBeenCalled();

    vi.advanceTimersByTime(20);

    expect(onFlush).toHaveBeenCalledWith([1, 2]);
  });
});
