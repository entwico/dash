// @vitest-environment happy-dom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useCopyToClipboard } from './use-copy-to-clipboard';

const writeText = vi.fn<(text: string) => Promise<void>>();

beforeEach(() => {
  vi.useFakeTimers();
  writeText.mockReset().mockResolvedValue();
  vi.stubGlobal('navigator', { clipboard: { writeText } });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('useCopyToClipboard', () => {
  it('copies the text and tells so until the reset time is over', async () => {
    const { result } = renderHook(() => useCopyToClipboard(500));

    expect(result.current.copied).toBe(false);

    await act(async () => {
      await expect(result.current.copy('hello')).resolves.toBe(true);
    });

    expect(writeText).toHaveBeenCalledWith('hello');
    expect(result.current.copied).toBe(true);

    act(() => void vi.advanceTimersByTime(499));

    expect(result.current.copied).toBe(true);

    act(() => void vi.advanceTimersByTime(1));

    expect(result.current.copied).toBe(false);
  });

  it('resets after two seconds by default', async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(() => result.current.copy('hello'));
    act(() => void vi.advanceTimersByTime(1999));

    expect(result.current.copied).toBe(true);

    act(() => void vi.advanceTimersByTime(1));

    expect(result.current.copied).toBe(false);
  });

  it('claims no copy when the clipboard refuses', async () => {
    writeText.mockRejectedValue(new Error('not allowed'));

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await expect(result.current.copy('hello')).resolves.toBe(false);
    });

    expect(result.current.copied).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('claims no copy where there is no clipboard at all', async () => {
    vi.stubGlobal('navigator', {});

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await expect(result.current.copy('hello')).resolves.toBe(false);
    });

    expect(result.current.copied).toBe(false);
  });

  it('starts the reset time over with every copy', async () => {
    const { result } = renderHook(() => useCopyToClipboard(500));

    await act(() => result.current.copy('one'));
    act(() => void vi.advanceTimersByTime(400));
    await act(() => result.current.copy('two'));
    act(() => void vi.advanceTimersByTime(400));

    expect(result.current.copied).toBe(true);

    act(() => void vi.advanceTimersByTime(100));

    expect(result.current.copied).toBe(false);
  });

  it('leaves no timer behind when it unmounts', async () => {
    const { result, unmount } = renderHook(() => useCopyToClipboard());

    await act(() => result.current.copy('hello'));
    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
