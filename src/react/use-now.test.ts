// @vitest-environment happy-dom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useNow } from './use-now';

const start = new Date('2026-01-01T00:00:00Z').getTime();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(start);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('useNow', () => {
  it('answers with the current time, and moves on every second', () => {
    const { result } = renderHook(() => useNow());

    expect(result.current).toBe(start);

    act(() => void vi.advanceTimersByTime(999));

    expect(result.current).toBe(start);

    act(() => void vi.advanceTimersByTime(1));

    expect(result.current).toBe(start + 1000);
  });

  it('ticks as often as it is told to', () => {
    const { result } = renderHook(() => useNow({ intervalMs: 15_000 }));

    act(() => void vi.advanceTimersByTime(14_999));

    expect(result.current).toBe(start);

    act(() => void vi.advanceTimersByTime(1));

    expect(result.current).toBe(start + 15_000);
  });

  it('keeps its last time while it is not active, and has no timer running', () => {
    const { result, rerender } = renderHook(({ active }) => useNow({ active }), {
      initialProps: { active: true },
    });

    act(() => void vi.advanceTimersByTime(2000));
    rerender({ active: false });

    expect(vi.getTimerCount()).toBe(0);

    act(() => void vi.advanceTimersByTime(5000));

    expect(result.current).toBe(start + 2000);
  });

  it('ticks again once it is active again', () => {
    const { result, rerender } = renderHook(({ active }) => useNow({ active }), {
      initialProps: { active: false },
    });

    act(() => void vi.advanceTimersByTime(5000));

    expect(result.current).toBe(start);

    rerender({ active: true });
    act(() => void vi.advanceTimersByTime(1000));

    expect(result.current).toBe(start + 6000);
  });

  it('leaves no timer behind when it unmounts', () => {
    renderHook(() => useNow()).unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
