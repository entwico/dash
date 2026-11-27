import { describe, expect, it } from 'vitest';

import { jsonForScript } from './json-for-script';

describe('jsonForScript', () => {
  it('writes nothing that could end the script tag or start a comment', () => {
    const json = jsonForScript({ html: '</script><script>alert(1)</script>', comment: '<!--' });

    expect(json).not.toContain('<');
  });

  it('parses back to the value it was given', () => {
    const value = { html: '</script>', nested: [1, '<b>', null], text: 'a < b' };

    expect(JSON.parse(jsonForScript(value))).toEqual(value);
  });

  it('is plain JSON for a value without the character', () => {
    expect(jsonForScript({ a: [1, 'two'] })).toBe('{"a":[1,"two"]}');
  });

  it('writes null for a value JSON has no form for', () => {
    expect(jsonForScript(undefined)).toBe('null');
    expect(jsonForScript(() => {})).toBe('null');
  });
});
