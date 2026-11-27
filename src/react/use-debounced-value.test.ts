// @vitest-environment happy-dom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDebouncedValue } from './use-debounced-value';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('useDebouncedValue', () => {
  it('answers with the initial value at once', () => {
    const { result } = renderHook(() => useDebouncedValue('a', 100));

    expect(result.current).toBe('a');
  });

  it('takes a new value only after the delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 100), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });
    act(() => void vi.advanceTimersByTime(99));

    expect(result.current).toBe('a');

    act(() => void vi.advanceTimersByTime(1));

    expect(result.current).toBe('b');
  });

  it('restarts the delay with every change, and skips the values in between', () => {
    const seen: string[] = [];

    const { result, rerender } = renderHook(
      ({ value }) => {
        const debounced = useDebouncedValue(value, 100);

        seen.push(debounced);

        return debounced;
      },
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'b' });
    act(() => void vi.advanceTimersByTime(60));
    rerender({ value: 'c' });
    act(() => void vi.advanceTimersByTime(60));

    expect(result.current).toBe('a');

    act(() => void vi.advanceTimersByTime(40));

    expect(result.current).toBe('c');
    expect(seen).not.toContain('b');
  });

  it('restarts the delay when the delay itself changes', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebouncedValue(value, delay), {
      initialProps: { value: 'a', delay: 100 },
    });

    rerender({ value: 'b', delay: 100 });
    act(() => void vi.advanceTimersByTime(50));
    rerender({ value: 'b', delay: 300 });
    act(() => void vi.advanceTimersByTime(100));

    expect(result.current).toBe('a');

    act(() => void vi.advanceTimersByTime(200));

    expect(result.current).toBe('b');
  });

  it('leaves no timer behind when it unmounts', () => {
    const { rerender, unmount } = renderHook(({ value }) => useDebouncedValue(value, 100), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });
    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
