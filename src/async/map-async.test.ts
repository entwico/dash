import { describe, expect, it } from 'vitest';

import { mapAsync } from './map-async';

async function* fromArray<T>(values: T[]): AsyncIterable<T> {
  for (const v of values) {
    yield v;
  }
}

describe('mapAsync', () => {
  it('lazily maps each value', async () => {
    const out = await Array.fromAsync(mapAsync(fromArray([1, 2, 3]), (n) => n * 10));

    expect(out).toEqual([10, 20, 30]);
  });
});
