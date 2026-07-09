/**
 * Returns the first value yielded by `iter`, then disposes the iterator. Throws if the iterable
 * completes without yielding. Equivalent of rxjs's `firstValueFrom` for AsyncIterables.
 */
export async function firstAsync<T>(iter: AsyncIterable<T>): Promise<T> {
  const it = iter[Symbol.asyncIterator]();

  try {
    const result = await it.next();

    if (result.done) {
      throw new Error('firstAsync: async iterable completed without yielding a value');
    }

    return result.value;
  } finally {
    await it.return?.();
  }
}
