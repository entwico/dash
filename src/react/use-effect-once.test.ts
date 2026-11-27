// @vitest-environment happy-dom
import { cleanup, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useEffectOnce } from './use-effect-once';

afterEach(cleanup);

describe('useEffectOnce', () => {
  it('runs on mount and on no later render', () => {
    const effect = vi.fn();
    const { rerender } = renderHook(() => useEffectOnce(effect));

    expect(effect).toHaveBeenCalledTimes(1);

    rerender();
    rerender();

    expect(effect).toHaveBeenCalledTimes(1);
  });

  it('runs the cleanup once the component is unmounted', async () => {
    const onCleanup = vi.fn();
    const { unmount } = renderHook(() => useEffectOnce(() => onCleanup));

    expect(onCleanup).not.toHaveBeenCalled();

    unmount();
    await Promise.resolve();

    expect(onCleanup).toHaveBeenCalledTimes(1);
  });

  it('runs no cleanup for an effect that answers with none', async () => {
    const { unmount } = renderHook(() => useEffectOnce(() => {}));

    unmount();

    await expect(Promise.resolve()).resolves.toBeUndefined();
  });

  describe('where strict mode mounts every component twice', () => {
    it('runs the effect once', () => {
      const effect = vi.fn();

      renderHook(() => useEffectOnce(effect), { wrapper: StrictMode });

      expect(effect).toHaveBeenCalledTimes(1);
    });

    it('keeps what the effect set up: the cleanup waits for the unmount', async () => {
      const onCleanup = vi.fn();
      const { unmount } = renderHook(() => useEffectOnce(() => onCleanup), { wrapper: StrictMode });

      await Promise.resolve();

      expect(onCleanup).not.toHaveBeenCalled();

      unmount();
      await Promise.resolve();

      expect(onCleanup).toHaveBeenCalledTimes(1);
    });
  });

  it('runs again for a component that is mounted anew', () => {
    const effect = vi.fn();

    renderHook(() => useEffectOnce(effect)).unmount();
    renderHook(() => useEffectOnce(effect));

    expect(effect).toHaveBeenCalledTimes(2);
  });
});
