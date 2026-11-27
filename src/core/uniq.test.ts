import { describe, expect, it } from 'vitest';

import { uniq, uniqBy } from './uniq';

describe('uniq', () => {
  it('keeps every value once, in the order of its first appearance', () => {
    expect(uniq([3, 1, 3, 2, 1])).toEqual([3, 1, 2]);
  });

  it('tells values apart by identity, not by content', () => {
    const item = { id: 1 };

    expect(uniq([item, item, { id: 1 }])).toEqual([{ id: 1 }, { id: 1 }]);
  });

  it('takes NaN for one value, and null and undefined for two', () => {
    expect(uniq([NaN, NaN, null, undefined, null])).toEqual([NaN, null, undefined]);
  });

  it('answers with a new array and leaves the given one alone', () => {
    const given = Object.freeze([1, 1]);

    expect(uniq(given)).toEqual([1]);
    expect(uniq([])).toEqual([]);
  });
});

describe('uniqBy', () => {
  const items = [
    { id: 1, group: 'a' },
    { id: 2, group: 'b' },
    { id: 3, group: 'a' },
  ];

  it('keeps the first item of every key, by property name', () => {
    expect(uniqBy(items, 'group')).toEqual([items[0], items[1]]);
  });

  it('keeps the first item of every key, by function', () => {
    expect(uniqBy(items, (item) => item.id % 2)).toEqual([items[0], items[1]]);
  });

  it('keeps everything when every key is its own', () => {
    expect(uniqBy(items, 'id')).toEqual(items);
  });

  it('takes a missing key for a key like any other', () => {
    const optional = [{ name: undefined }, { name: 'a' }, { name: undefined }];

    expect(uniqBy(optional, 'name')).toEqual([optional[0], optional[1]]);
  });

  it('answers with a new array for an empty one', () => {
    expect(uniqBy([] as { id: number }[], 'id')).toEqual([]);
  });
});
