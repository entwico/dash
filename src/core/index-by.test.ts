import { describe, expect, it } from 'vitest';

import { indexBy } from './index-by';

const items = [
  { id: 'a', name: 'Alpha' },
  { id: 'b', name: 'Beta' },
];

describe('indexBy', () => {
  it('maps by property key', () => {
    const map = indexBy(items, 'id');

    expect(map.get('a')).toEqual({ id: 'a', name: 'Alpha' });
    expect(map.get('b')).toEqual({ id: 'b', name: 'Beta' });
    expect(map.size).toBe(2);
  });

  it('maps by key function', () => {
    const map = indexBy(items, (item) => item.id.toUpperCase());

    expect(map.get('A')).toEqual({ id: 'a', name: 'Alpha' });
  });

  it('maps values by property key', () => {
    const map = indexBy(items, 'id', 'name');

    expect(map.get('a')).toBe('Alpha');
    expect(map.get('b')).toBe('Beta');
  });

  it('maps values by value function', () => {
    const map = indexBy(items, 'id', (item) => item.name.length);

    expect(map.get('a')).toBe(5);
    expect(map.get('b')).toBe(4);
  });

  it('accepts readonly arrays', () => {
    const readonlyItems: readonly { id: string; name: string }[] = items;
    const map = indexBy(readonlyItems, 'id');

    expect(map.size).toBe(2);
  });
});
