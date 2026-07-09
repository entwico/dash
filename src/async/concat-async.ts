/**
 * Concatenates all elements of all arrays yielded by `iter` into a single array. Used to support
 * subscriptions that emit chunks of items before completing.
 */
export async function concatAsync<T>(iter: AsyncIterable<T[]>): Promise<T[]> {
  const out: T[] = [];

  for await (const chunk of iter) {
    out.push(...chunk);
  }

  return out;
}
