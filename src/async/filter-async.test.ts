import { describe, expect, it } from 'vitest';

import { filterAsync } from './filter-async';

async function* fromArray<T>(values: T[]): AsyncIterable<T> {
  for (const v of values) {
    yield v;
  }
}

describe('filterAsync', () => {
  it('drops values for which predicate is false', async () => {
    const out = await Array.fromAsync(filterAsync(fromArray([1, 2, 3, 4]), (n) => n % 2 === 0));

    expect(out).toEqual([2, 4]);
  });
});
