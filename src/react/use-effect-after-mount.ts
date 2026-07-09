import { type DependencyList, type EffectCallback, useEffect, useRef } from 'react';

/**
 * Runs the effect on dependency changes, but skips the initial mount.
 */
export function useEffectAfterMount(effect: EffectCallback, deps?: DependencyList | undefined) {
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current) {
      return effect();
    }
    mountedRef.current = true;
  }, deps); // eslint-disable-line @eslint-react/exhaustive-deps
}
