/**
 * Runs a full garbage collection. Throws without `gc()`, which Node only exposes when started with
 * `--expose-gc` (vitest: `test.execArgv: ['--expose-gc']`): a test that skipped the collection
 * instead would pass with every leak it exists to find.
 */
export function collectGarbage(): void {
  const { gc } = globalThis as { gc?: (() => void) | undefined };

  if (!gc) {
    throw new Error('gc() is missing: the tests have to run with --expose-gc');
  }

  gc();
}

export type CountAliveOptions = {
  /** how often to collect before the survivors count as kept (default 30) */
  rounds?: number | undefined;

  /** pause before every collection, for finished promise chains, timers and socket callbacks to settle (default 10) */
  pauseMs?: number | undefined;
};

/**
 * How many of the weakly referenced objects survive garbage collection. Collects until none is
 * left or the rounds are used up, so an answer above zero takes the full `rounds × pauseMs`.
 *
 * The caller must not hold the objects itself: create them in a function that returns only the
 * `WeakRef`s, since a local variable, or a value the test awaited, keeps its object alive.
 */
export async function countAlive(
  refs: readonly WeakRef<object>[],
  options?: CountAliveOptions | undefined,
): Promise<number> {
  const rounds = options?.rounds ?? 30;
  const pauseMs = options?.pauseMs ?? 10;
  let alive = refs.length;

  for (let round = 0; round < rounds && alive > 0; round++) {
    await new Promise((resolve) => setTimeout(resolve, pauseMs));
    collectGarbage();
    alive = refs.filter((ref) => ref.deref() !== undefined).length;
  }

  return alive;
}
