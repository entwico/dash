// @vitest-environment happy-dom
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useEffectAfterMount } from './use-effect-after-mount';

afterEach(cleanup);

describe('useEffectAfterMount', () => {
  it('skips the mount and runs when a dependency changes', () => {
    const effect = vi.fn();

    const { rerender } = renderHook(({ dep }) => useEffectAfterMount(effect, [dep]), {
      initialProps: { dep: 1 },
    });

    expect(effect).not.toHaveBeenCalled();

    rerender({ dep: 2 });

    expect(effect).toHaveBeenCalledTimes(1);
  });

  it('does not run on a render that changes no dependency', () => {
    const effect = vi.fn();

    const { rerender } = renderHook(({ dep }) => useEffectAfterMount(effect, [dep]), {
      initialProps: { dep: 1 },
    });

    rerender({ dep: 1 });

    expect(effect).not.toHaveBeenCalled();
  });

  it('runs on every later render without dependencies', () => {
    const effect = vi.fn();
    const { rerender } = renderHook(() => useEffectAfterMount(effect));

    rerender();
    rerender();

    expect(effect).toHaveBeenCalledTimes(2);
  });

  it('never runs with an empty dependency list', () => {
    const effect = vi.fn();
    const { rerender } = renderHook(() => useEffectAfterMount(effect, []));

    rerender();

    expect(effect).not.toHaveBeenCalled();
  });

  it('runs the cleanup before the next run and on unmount', () => {
    const cleanups: number[] = [];

    const { rerender, unmount } = renderHook(
      ({ dep }) => useEffectAfterMount(() => () => void cleanups.push(dep), [dep]),
      { initialProps: { dep: 1 } },
    );

    rerender({ dep: 2 });

    expect(cleanups).toEqual([]);

    rerender({ dep: 3 });

    expect(cleanups).toEqual([2]);

    unmount();

    expect(cleanups).toEqual([2, 3]);
  });
});
