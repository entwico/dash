import { describe, expect, it } from 'vitest';

import { escapeRegExp } from './escape-reg-exp';

describe('escapeRegExp', () => {
  const special = '.*+?^${}()|[]\\/-';

  it('makes a text of special characters match itself, and nothing else', () => {
    const pattern = new RegExp(`^${escapeRegExp(special)}$`);

    expect(pattern.test(special)).toBe(true);
    expect(pattern.test('anything')).toBe(false);
  });

  it('takes the meaning from a wildcard', () => {
    const pattern = new RegExp(escapeRegExp('a.c'));

    expect(pattern.test('a.c')).toBe(true);
    expect(pattern.test('abc')).toBe(false);
  });

  it('leaves text without special characters as it is', () => {
    expect(escapeRegExp('plain text 123')).toBe('plain text 123');
  });
});
