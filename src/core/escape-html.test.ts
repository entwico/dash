import { describe, expect, it } from 'vitest';

import { escapeHtml } from './escape-html';

describe('escapeHtml', () => {
  it('escapes the characters that end text, a tag or an attribute value', () => {
    expect(escapeHtml(`<a href="x" title='y'>Tom & Jerry</a>`)).toBe(
      '&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;Tom &amp; Jerry&lt;/a&gt;',
    );
  });

  it('escapes an ampersand that already starts an entity', () => {
    expect(escapeHtml('&amp;')).toBe('&amp;amp;');
  });

  it('leaves everything else as it is', () => {
    expect(escapeHtml('Grüße, 你好 — 100 % / `code`')).toBe('Grüße, 你好 — 100 % / `code`');
    expect(escapeHtml('')).toBe('');
  });
});
