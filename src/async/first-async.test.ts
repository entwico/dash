import { describe, expect, it } from 'vitest';

import { firstAsync } from './first-async';

async function* fromArray<T>(values: T[]): AsyncIterable<T> {
  for (const v of values) {
    yield v;
  }
}

describe('firstAsync', () => {
  it('yields the first value and disposes the iterator', async () => {
    let returned = false;

    const iter: AsyncIterable<number> = {
      [Symbol.asyncIterator]() {
        let i = 0;

        return {
          async next() {
            return i++ < 3 ? { value: i, done: false } : { value: undefined as unknown as number, done: true };
          },
          async return() {
            returned = true;

            return { value: undefined as unknown as number, done: true };
          },
        };
      },
    };

    expect(await firstAsync(iter)).toBe(1);
    expect(returned).toBe(true);
  });

  it('throws when iterable completes with no values', async () => {
    await expect(firstAsync(fromArray<number>([]))).rejects.toThrow(/completed without yielding/);
  });
});
