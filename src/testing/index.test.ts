import { describe, expect, it } from 'vitest';

import { collectGarbage, countAlive } from './index';

function createRefs(count: number, keep: object[] = []): WeakRef<object>[] {
  return Array.from({ length: count }, (_, index) => {
    const object = { index };

    if (index < keep.length) {
      keep[index] = object;
    }

    return new WeakRef(object);
  });
}

describe('collectGarbage', () => {
  it('throws when gc() is not exposed', () => {
    const global = globalThis as { gc?: (() => void) | undefined };
    const { gc } = global;

    // the property cannot be redefined, only assigned
    global.gc = undefined;

    try {
      expect(() => collectGarbage()).toThrow('--expose-gc');
    } finally {
      global.gc = gc;
    }
  });
});

describe('countAlive', () => {
  it('counts nothing once nobody holds the objects', async () => {
    expect(await countAlive(createRefs(10))).toBe(0);
  });

  it('counts the objects somebody still holds', async () => {
    const kept: object[] = Array.from({ length: 3 });

    expect(await countAlive(createRefs(10, kept), { rounds: 5 })).toBe(3);
    expect(kept).toHaveLength(3);
  });

  it('counts an object that is let go while it collects', async () => {
    const kept: object[] = Array.from({ length: 1 });
    const refs = createRefs(1, kept);

    setTimeout(() => void (kept.length = 0), 30);

    expect(await countAlive(refs)).toBe(0);
  });
});
