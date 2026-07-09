import { describe, expect, it } from 'vitest';

import { optionalize } from './optionalize';

describe('optionalize', () => {
  it('passes defined values through the function', () => {
    const double = optionalize((n: number) => n * 2);

    expect(double(21)).toBe(42);
  });

  it('returns undefined for null or undefined by default', () => {
    const double = optionalize((n: number) => n * 2);

    expect(double(null)).toBeUndefined();
    expect(double(undefined)).toBeUndefined();
  });

  it('returns the default value when provided', () => {
    const double = optionalize((n: number) => n * 2, { defaultValue: -1 });

    expect(double(null)).toBe(-1);
  });

  it('treats falsy values as empty with the falsy strategy', () => {
    const upper = optionalize((s: string) => s.toUpperCase(), { defaultValue: 'empty', strategy: 'falsy' });

    expect(upper('')).toBe('empty');
    expect(upper('a')).toBe('A');
  });

  it('processes falsy values with the default strategy', () => {
    const double = optionalize((n: number) => n * 2);

    expect(double(0)).toBe(0);
  });
});
