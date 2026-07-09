import { describe, expect, it } from 'vitest';

import { concatAsync } from './concat-async';

async function* fromArray<T>(values: T[]): AsyncIterable<T> {
  for (const v of values) {
    yield v;
  }
}

describe('concatAsync', () => {
  it('concatenates all yielded arrays into one', async () => {
    expect(
      await concatAsync(
        fromArray([
          [1, 2],
          [3, 4, 5],
        ]),
      ),
    ).toEqual([1, 2, 3, 4, 5]);
  });

  it('returns an empty array when the source is empty', async () => {
    expect(await concatAsync(fromArray<number[]>([]))).toEqual([]);
  });
});
