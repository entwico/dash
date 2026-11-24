import { deriveAsync } from './derive-async';

/** Lazy filter over an async iterable. Cleanup propagates: breaking the outer iter disposes the inner. */
export function filterAsync<T>(iter: AsyncIterable<T>, predicate: (value: T) => boolean): AsyncIterable<T> {
  return deriveAsync(iter, (value) => (predicate(value) ? { value } : undefined));
}
