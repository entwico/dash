// @vitest-environment happy-dom
import { act, cleanup, renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useIsMobile } from './use-is-mobile';
import { useMediaQuery } from './use-media-query';

/** A `matchMedia` whose queries match what the test says, and tell their listeners when that changes. */
function stubMatchMedia() {
  const matching = new Set<string>();
  const listeners = new Map<string, Set<() => void>>();

  vi.stubGlobal('matchMedia', (query: string) => ({
    get matches() {
      return matching.has(query);
    },
    addEventListener: (_type: string, listener: () => void) => {
      listeners.set(query, (listeners.get(query) ?? new Set()).add(listener));
    },
    removeEventListener: (_type: string, listener: () => void) => {
      listeners.get(query)?.delete(listener);
    },
  }));

  return {
    set(query: string, matches: boolean) {
      if (matches) {
        matching.add(query);
      } else {
        matching.delete(query);
      }

      listeners.get(query)?.forEach((listener) => listener());
    },
    listeners: (query: string) => listeners.get(query)?.size ?? 0,
  };
}

let media: ReturnType<typeof stubMatchMedia>;

beforeEach(() => {
  media = stubMatchMedia();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('useMediaQuery', () => {
  const wide = '(min-width: 64rem)';
  const dark = '(prefers-color-scheme: dark)';

  it('answers with whether the query matches on mount', () => {
    media.set(wide, true);

    expect(renderHook(() => useMediaQuery(wide)).result.current).toBe(true);
    expect(renderHook(() => useMediaQuery(dark)).result.current).toBe(false);
  });

  it('follows the query as it starts and stops matching', () => {
    const { result } = renderHook(() => useMediaQuery(wide));

    act(() => media.set(wide, true));

    expect(result.current).toBe(true);

    act(() => media.set(wide, false));

    expect(result.current).toBe(false);
  });

  it('follows the new query when the query changes, and leaves the old one', () => {
    media.set(dark, true);

    const { result, rerender } = renderHook(({ query }) => useMediaQuery(query), {
      initialProps: { query: wide },
    });

    rerender({ query: dark });

    expect(result.current).toBe(true);
    expect(media.listeners(wide)).toBe(0);
    expect(media.listeners(dark)).toBe(1);
  });

  it('leaves no listener behind when it unmounts', () => {
    const { unmount } = renderHook(() => useMediaQuery(wide));

    expect(media.listeners(wide)).toBe(1);

    unmount();

    expect(media.listeners(wide)).toBe(0);
  });

  it('answers false on the server, whatever the query would match', () => {
    media.set(wide, true);

    const Probe = () => String(useMediaQuery(wide));

    expect(renderToString(createElement(Probe))).toBe('false');
  });
});

describe('useIsMobile', () => {
  const mobile = '(max-width: 767px)';

  it('is true below the 768px breakpoint and false from it on', () => {
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);

    act(() => media.set(mobile, true));

    expect(result.current).toBe(true);
  });

  it('answers false on the server', () => {
    media.set(mobile, true);

    const Probe = () => String(useIsMobile());

    expect(renderToString(createElement(Probe))).toBe('false');
  });
});
