/**
 * Order-preserving concurrent map: runs `fn` over the items with a sliding pool of at most
 * `concurrency` workers, so a slow item never stalls the others. Rejects with the first error; items
 * already running finish, no further item is started.
 */
export async function mapConcurrent<T, R>(
  items: readonly T[],
  fn: (item: T, index: number) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  const results: R[] = Array.from({ length: items.length });
  let nextIndex = 0;

  let failed = false;

  async function worker(): Promise<void> {
    // the caller has its error by then: nothing would take the results of the remaining items
    while (!failed) {
      const i = nextIndex++;

      if (i >= items.length) {
        return;
      }

      try {
        results[i] = await fn(items[i]!, i);
      } catch (error) {
        failed = true;

        throw error;
      }
    }
  }

  const workerCount = Math.max(1, Math.min(concurrency, items.length));
  const workers = Array.from({ length: workerCount }, () => worker());

  await Promise.all(workers);

  return results;
}
