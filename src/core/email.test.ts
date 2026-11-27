import { describe, expect, it } from 'vitest';

import { EMAIL_PATTERN, isValidEmail } from './email';

describe('isValidEmail', () => {
  it.each([
    'user@example.com',
    'first.last+tag@sub.example.co.uk',
    'jürgen@müller.de',
    'user@xn--mller-kva.de',
    'o\'brien@example.com',
  ])('accepts %s', (value) => {
    expect(isValidEmail(value)).toBe(true);
  });

  it.each([
    ['nothing', ''],
    ['no @', 'user.example.com'],
    ['no dot in the domain', 'user@localhost'],
    ['nothing before the @', '@example.com'],
    ['nothing after the dot', 'user@example.'],
    ['nothing between @ and dot', 'user@.com'],
    ['two @', 'user@@example.com'],
    ['a space', 'us er@example.com'],
    ['whitespace around it', ' user@example.com '],
    ['a second line', 'user@example.com\nmore'],
  ])('rejects %s', (_name, value) => {
    expect(isValidEmail(value)).toBe(false);
  });

  it('answers the same on every call', () => {
    expect(EMAIL_PATTERN.global).toBe(false);
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('user@example.com')).toBe(true);
  });
});
