import { describe, expect, it } from 'vitest';

import { omitUndefined } from './omit-undefined';

describe('omitUndefined', () => {
  it('removes undefined properties', () => {
    expect(omitUndefined({ a: 1, b: undefined, c: 'x' })).toEqual({ a: 1, c: 'x' });
  });

  it('keeps null values', () => {
    expect(omitUndefined({ a: null, b: undefined })).toEqual({ a: null });
  });

  it('processes nested objects recursively by default', () => {
    expect(omitUndefined({ a: { b: undefined, c: 1 } })).toEqual({ a: { c: 1 } });
  });

  it('processes arrays recursively', () => {
    expect(omitUndefined({ a: [{ b: undefined, c: 1 }, undefined, 2] })).toEqual({ a: [{ c: 1 }, 2] });
  });

  it('keeps nested undefined properties in shallow mode', () => {
    const nested = { b: undefined, c: 1 };

    expect(omitUndefined({ a: nested, d: undefined }, false)).toEqual({ a: nested });
  });

  it('preserves Date instances', () => {
    const date = new Date(2026, 0, 1);

    expect(omitUndefined({ a: date })).toEqual({ a: date });
  });
});
