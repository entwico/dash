import { describe, expect, it } from 'vitest';

import { deepFreeze } from './deep-freeze';

describe('deepFreeze', () => {
  it('freezes nested objects and arrays', () => {
    const value = { a: { b: [{ c: 1 }] } };
    const frozen = deepFreeze(value);

    expect(Object.isFrozen(frozen)).toBe(true);
    expect(Object.isFrozen(value.a)).toBe(true);
    expect(Object.isFrozen(value.a.b)).toBe(true);
    expect(Object.isFrozen(value.a.b[0])).toBe(true);
  });

  it('returns the same reference', () => {
    const value = { a: 1 };

    expect(deepFreeze(value)).toBe(value);
  });

  it('makes mutation throw', () => {
    const frozen = deepFreeze({ a: { b: 1 } });

    expect(() => {
      (frozen.a as { b: number }).b = 2;
    }).toThrow(TypeError);
  });

  it('passes primitives through', () => {
    expect(deepFreeze(1)).toBe(1);
    expect(deepFreeze('a')).toBe('a');
    expect(deepFreeze(null)).toBe(null);
    expect(deepFreeze(undefined)).toBe(undefined);
  });

  it('handles cyclic structures', () => {
    type Node = { name: string; self?: Node | undefined };

    const value: Node = { name: 'x' };

    value.self = value;

    const frozen = deepFreeze(value);

    expect(Object.isFrozen(frozen)).toBe(true);
    expect(Object.isFrozen(frozen.self)).toBe(true);
  });

  it('freezes map and set contents', () => {
    const entry = { a: 1 };
    const item = { b: 2 };
    const value = { map: new Map([['k', entry]]), set: new Set([item]) };

    deepFreeze(value);

    expect(Object.isFrozen(value.map)).toBe(true);
    expect(Object.isFrozen(entry)).toBe(true);
    expect(Object.isFrozen(value.set)).toBe(true);
    expect(Object.isFrozen(item)).toBe(true);
  });

  it('skips typed arrays', () => {
    const value = { buf: new Uint8Array([1, 2, 3]) };

    expect(() => deepFreeze(value)).not.toThrow();
    expect(Object.isFrozen(value)).toBe(true);
    expect(Object.isFrozen(value.buf)).toBe(false);
  });

  it('does not descend into already-frozen values', () => {
    const inner = { a: 1 };
    const outer = Object.freeze({ inner });

    deepFreeze(outer);

    expect(Object.isFrozen(inner)).toBe(false);
  });
});
