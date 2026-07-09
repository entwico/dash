/** Lazy filter over an async iterable. */
export async function* filterAsync<T>(iter: AsyncIterable<T>, predicate: (value: T) => boolean): AsyncIterable<T> {
  for await (const value of iter) {
    if (predicate(value)) {
      yield value;
    }
  }
}
