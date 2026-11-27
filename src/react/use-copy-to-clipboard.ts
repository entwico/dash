import { useCallback, useEffect, useRef, useState } from 'react';

export type CopyToClipboard = {
  /** true from a successful copy until `resetMs` later */
  copied: boolean;

  /** Copies the text, and answers whether the clipboard took it. */
  copy: (text: string) => Promise<boolean>;
};

/**
 * Copies text to the clipboard and tells for `resetMs` (default 2000) that it did, for a button
 * that shows "copied" for a moment. A clipboard that refuses (no permission, insecure context)
 * leaves `copied` false instead of claiming a copy.
 */
export function useCopyToClipboard(resetMs = 2000): CopyToClipboard {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        return false;
      }

      clearTimeout(timerRef.current);
      setCopied(true);
      timerRef.current = setTimeout(() => setCopied(false), resetMs);

      return true;
    },
    [resetMs],
  );

  return { copied, copy };
}
