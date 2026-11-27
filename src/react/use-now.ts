import { useEffect, useState } from 'react';

export type UseNowOptions = {
  /** how often the clock ticks (default 1000) */
  intervalMs?: number | undefined;

  /** whether the clock ticks; a stopped clock keeps its last time (default true) */
  active?: boolean | undefined;
};

/**
 * A ticking clock: the current time as a timestamp, re-rendering the component on every tick. For
 * elapsed times and countdowns that have to move while nothing else changes.
 */
export function useNow(options?: UseNowOptions | undefined): number {
  const intervalMs = options?.intervalMs ?? 1000;
  const active = options?.active ?? true;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) {
      return;
    }

    const timer = setInterval(() => setNow(Date.now()), intervalMs);

    return () => clearInterval(timer);
  }, [active, intervalMs]);

  return now;
}
