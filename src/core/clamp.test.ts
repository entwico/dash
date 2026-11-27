import { describe, expect, it } from 'vitest';

import { clamp } from './clamp';

describe('clamp', () => {
  it('leaves a value within the bounds as it is, the bounds included', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it('answers with the bound the value is beyond', () => {
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
    expect(clamp(Infinity, 0, 10)).toBe(10);
    expect(clamp(-Infinity, 0, 10)).toBe(0);
  });

  it('works with negative and fractional bounds', () => {
    expect(clamp(-7, -5, -1)).toBe(-5);
    expect(clamp(0.75, 0, 0.5)).toBe(0.5);
  });

  it('answers with NaN for NaN', () => {
    expect(clamp(NaN, 0, 10)).toBeNaN();
  });
});
