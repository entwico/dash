import { describe, expect, it } from 'vitest';

import { truncate } from './truncate';

describe('truncate', () => {
  it('leaves text that fits as it is, up to exactly the maximum', () => {
    expect(truncate('hello', 10)).toBe('hello');
    expect(truncate('hello', 5)).toBe('hello');
    expect(truncate('', 5)).toBe('');
  });

  it('cuts longer text to the maximum, the ellipsis included', () => {
    const result = truncate('hello world', 8);

    expect(result).toBe('hello w…');
    expect(result).toHaveLength(8);
  });

  it('leaves no whitespace before the ellipsis', () => {
    expect(truncate('hello world', 7)).toBe('hello…');
  });

  it('answers with the ellipsis alone when nothing else fits', () => {
    expect(truncate('hello', 1)).toBe('…');
    expect(truncate('hello', 0)).toBe('…');
  });
});
