/** Lazy map over an async iterable. Cleanup propagates: breaking the outer iter disposes the inner. */
export async function* mapAsync<T, R>(iter: AsyncIterable<T>, fn: (value: T) => R): AsyncIterable<R> {
  for await (const value of iter) {
    yield fn(value);
  }
}
