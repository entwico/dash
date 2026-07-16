import { describe, expect, it } from 'vitest';

import { chunk } from './chunk';

describe('chunk', () => {
  it('returns an empty array for empty input', () => {
    expect(chunk([], 3)).toEqual([]);
  });

  it('splits evenly when the length is an exact multiple', () => {
    expect(chunk([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it('puts the remainder in the final chunk', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('yields a single chunk when size exceeds the length', () => {
    expect(chunk([1, 2, 3], 10)).toEqual([[1, 2, 3]]);
  });

  it('throws when size is zero or negative', () => {
    expect(() => chunk([1, 2, 3], 0)).toThrow('chunk size must be greater than 0');
    expect(() => chunk([1, 2, 3], -1)).toThrow('chunk size must be greater than 0');
  });
});
