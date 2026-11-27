import { describe, expect, it } from 'vitest';

import { errorMessage } from './error-message';

describe('errorMessage', () => {
  it('answers with the message of an error, a subclass included', () => {
    expect(errorMessage(new Error('boom'))).toBe('boom');
    expect(errorMessage(new TypeError('typed'), 'fallback')).toBe('typed');
  });

  it('answers with the fallback for anything that is not an error', () => {
    expect(errorMessage('text', 'fallback')).toBe('fallback');
    expect(errorMessage({ message: 'looks like one' }, 'fallback')).toBe('fallback');
    expect(errorMessage(undefined, 'fallback')).toBe('fallback');
  });

  it('answers with the value as a string when there is no fallback', () => {
    expect(errorMessage('text')).toBe('text');
    expect(errorMessage(404)).toBe('404');
    expect(errorMessage(null)).toBe('null');
    expect(errorMessage(undefined)).toBe('undefined');
  });

  it('keeps an empty fallback', () => {
    expect(errorMessage('text', '')).toBe('');
  });
});
