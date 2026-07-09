/**
 * Order-preserving concurrent map: runs `fn` over the items with a sliding pool of at most
 * `concurrency` workers, so a slow item never stalls the others. Errors propagate via Promise.all.
 */
export async function mapConcurrent<T, R>(
  items: readonly T[],
  fn: (item: T, index: number) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  const results: R[] = Array.from({ length: items.length });
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (true) {
      const i = nextIndex++;

      if (i >= items.length) {
        return;
      }

      results[i] = await fn(items[i]!, i);
    }
  }

  const workerCount = Math.max(1, Math.min(concurrency, items.length));
  const workers = Array.from({ length: workerCount }, () => worker());

  await Promise.all(workers);

  return results;
}
