import { type EffectCallback, useEffect, useRef } from 'react';

/**
 * Runs the effect exactly once on mount.
 */
export function useEffectOnce(effect: EffectCallback) {
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) {
      return;
    }

    hasRunRef.current = true;

    return effect();
  }, []); // eslint-disable-line @eslint-react/exhaustive-deps
}
