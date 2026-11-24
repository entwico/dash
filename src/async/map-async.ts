import { deriveAsync } from './derive-async';

/** Lazy map over an async iterable. Cleanup propagates: breaking the outer iter disposes the inner. */
export function mapAsync<T, R>(iter: AsyncIterable<T>, fn: (value: T) => R): AsyncIterable<R> {
  return deriveAsync(iter, (value) => ({ value: fn(value) }));
}
