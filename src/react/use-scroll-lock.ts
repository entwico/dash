import { useEffect } from 'react';

let locks = 0;
let overflowBefore = '';

/**
 * Locks page scroll while `locked` is true, for overlays, drawers and menus. Counted, so
 * overlapping overlays don't unlock each other: the page scrolls again once the last one is gone.
 *
 * The lock is `overflow: hidden` on `<html>`, not on `<body>`: an overflow on the root element
 * stops the one of the body from reaching the viewport.
 */
export function useScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) {
      return;
    }

    const root = document.documentElement;

    if (locks === 0) {
      overflowBefore = root.style.overflow;
      root.style.overflow = 'hidden';
    }

    locks += 1;

    return () => {
      locks -= 1;

      if (locks === 0) {
        root.style.overflow = overflowBefore;
      }
    };
  }, [locked]);
}
