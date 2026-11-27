import { type EffectCallback, useEffect, useRef } from 'react';

type Run = {
  cleanup: ReturnType<EffectCallback>;
  leaving: boolean;
};

/**
 * Runs the effect exactly once on mount, and its cleanup once on unmount.
 *
 * Strict mode unmounts and mounts every component again right after its first mount. The effect
 * does not run a second time for that, and its cleanup does not run either: a cleanup waits a
 * microtask, and is called off when the component is back by then. So the cleanup of a real unmount
 * runs a microtask after it, not during it.
 */
export function useEffectOnce(effect: EffectCallback) {
  const runRef = useRef<Run | undefined>(undefined);

  useEffect(() => {
    runRef.current ??= { cleanup: effect(), leaving: false };

    const run = runRef.current;

    run.leaving = false;

    return () => {
      run.leaving = true;

      queueMicrotask(() => {
        if (!run.leaving) {
          return;
        }

        if (runRef.current === run) {
          runRef.current = undefined;
        }

        run.cleanup?.();
      });
    };
  }, []); // eslint-disable-line @eslint-react/exhaustive-deps
}
