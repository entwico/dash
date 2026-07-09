import { describe, expect, it } from 'vitest';

import { createMatcher, matches, matchesAny } from './index';

describe('matches', () => {
  it('matches exact', () => {
    expect(matches('/health', { exact: '/health' })).toBe(true);
    expect(matches('/health/live', { exact: '/health' })).toBe(false);
  });

  it('matches prefix', () => {
    expect(matches('/_astro/chunk.js', { prefix: '/_astro/' })).toBe(true);
    expect(matches('/api/_astro/', { prefix: '/_astro/' })).toBe(false);
  });

  it('matches suffix', () => {
    expect(matches('/logo.svg', { suffix: '.svg' })).toBe(true);
    expect(matches('/logo.svg.map', { suffix: '.svg' })).toBe(false);
  });

  it('matches substring', () => {
    expect(matches('/a/webhooks/b', { includes: '/webhooks/' })).toBe(true);
    expect(matches('/a/b', { includes: '/webhooks/' })).toBe(false);
  });

  it('matches regexp', () => {
    expect(matches('/api/v2/users', { pattern: /^\/api\/v\d+\// })).toBe(true);
    expect(matches('/api/users', { pattern: /^\/api\/v\d+\// })).toBe(false);
  });

  it('matches function', () => {
    expect(matches('abc', (value) => value.length === 3)).toBe(true);
    expect(matches('abcd', (value) => value.length === 3)).toBe(false);
  });
});

describe('matchesAny', () => {
  it('matches when any pattern matches', () => {
    const patterns = [{ exact: '/robots.txt' }, { prefix: '/_astro/' }];

    expect(matchesAny('/robots.txt', patterns)).toBe(true);
    expect(matchesAny('/_astro/x.css', patterns)).toBe(true);
    expect(matchesAny('/products', patterns)).toBe(false);
  });

  it('returns false for empty pattern list', () => {
    expect(matchesAny('/anything', [])).toBe(false);
  });
});

describe('createMatcher', () => {
  it('behaves like matchesAny for every pattern shape', () => {
    const matcher = createMatcher([
      { exact: '/favicon.ico' },
      { exact: '/robots.txt' },
      { prefix: '/_astro/' },
      { suffix: '.map' },
      { includes: '/internal/' },
      { pattern: /^\/api\/v\d+\// },
      (value) => value === '/fn-matched',
    ]);

    expect(matcher('/favicon.ico')).toBe(true);
    expect(matcher('/robots.txt')).toBe(true);
    expect(matcher('/_astro/chunk.js')).toBe(true);
    expect(matcher('/main.js.map')).toBe(true);
    expect(matcher('/a/internal/b')).toBe(true);
    expect(matcher('/api/v1/users')).toBe(true);
    expect(matcher('/fn-matched')).toBe(true);

    expect(matcher('/products')).toBe(false);
    expect(matcher('/favicon.ico/nested')).toBe(false);
  });

  it('returns a matcher that rejects everything for an empty pattern list', () => {
    const matcher = createMatcher([]);

    expect(matcher('/anything')).toBe(false);
    expect(matcher('')).toBe(false);
  });

  it('collapses exact patterns into a set lookup', () => {
    const matcher = createMatcher(Array.from({ length: 100 }, (_, i) => ({ exact: `/path-${i}` })));

    expect(matcher('/path-42')).toBe(true);
    expect(matcher('/path-100')).toBe(false);
  });
});
