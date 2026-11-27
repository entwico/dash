// @vitest-environment happy-dom
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useScrollLock } from './use-scroll-lock';

const overflow = () => document.documentElement.style.overflow;

afterEach(() => {
  cleanup();
  document.documentElement.style.overflow = '';
});

describe('useScrollLock', () => {
  it('locks the page while it is told to, and not otherwise', () => {
    const { rerender } = renderHook(({ locked }) => useScrollLock(locked), {
      initialProps: { locked: false },
    });

    expect(overflow()).toBe('');

    rerender({ locked: true });

    expect(overflow()).toBe('hidden');

    rerender({ locked: false });

    expect(overflow()).toBe('');
  });

  it('unlocks when the component that locked unmounts', () => {
    const { unmount } = renderHook(() => useScrollLock(true));

    unmount();

    expect(overflow()).toBe('');
  });

  it('stays locked until the last of several locks is gone', () => {
    const first = renderHook(() => useScrollLock(true));
    const second = renderHook(() => useScrollLock(true));

    first.unmount();

    expect(overflow()).toBe('hidden');

    second.unmount();

    expect(overflow()).toBe('');
  });

  it('gives back the overflow the page had before', () => {
    document.documentElement.style.overflow = 'clip';

    const { unmount } = renderHook(() => useScrollLock(true));

    expect(overflow()).toBe('hidden');

    unmount();

    expect(overflow()).toBe('clip');
  });

  it('leaves the body alone', () => {
    renderHook(() => useScrollLock(true));

    expect(document.body.style.overflow).toBe('');
  });
});
