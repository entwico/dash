import { describe, expect, it } from 'vitest';

import { maybeAll, maybeAllSettled, maybeCatch, maybeFinally, maybeThen } from './maybe-promise';

describe('maybeThen', () => {
  it('transforms sync values synchronously', () => {
    expect(maybeThen(2, (v) => v * 2)).toBe(4);
  });

  it('chains promises', async () => {
    await expect(maybeThen(Promise.resolve(2), (v) => v * 2)).resolves.toBe(4);
  });

  it('ignores onRejected on the sync path', () => {
    expect(maybeThen(2, (v) => v * 2, () => -1)).toBe(4);
  });

  it('recovers rejected promises via onRejected', async () => {
    await expect(maybeThen(Promise.reject(new Error('boom')), (v) => v, () => -1)).resolves.toBe(-1);
  });

  it('leaves rejections unhandled when no onRejected is given', async () => {
    await expect(maybeThen(Promise.reject(new Error('boom')), (v) => v)).rejects.toThrow('boom');
  });
});

describe('maybeCatch', () => {
  it('returns sync values as-is', () => {
    expect(maybeCatch(2, () => -1)).toBe(2);
  });

  it('catches promise rejections', async () => {
    await expect(maybeCatch(Promise.reject(new Error('boom')), () => -1)).resolves.toBe(-1);
  });
});

describe('maybeFinally', () => {
  it('runs the callback synchronously and returns the value', () => {
    let ran = false;
    const result = maybeFinally(2, () => {
      ran = true;
    });

    expect(ran).toBe(true);
    expect(result).toBe(2);
  });

  it('runs the callback after a promise resolves and passes the value through', async () => {
    let ran = false;
    const result = maybeFinally(Promise.resolve(2), () => {
      ran = true;
    });

    await expect(result).resolves.toBe(2);
    expect(ran).toBe(true);
  });

  it('runs the callback after a promise rejects and passes the reason through', async () => {
    let ran = false;
    const result = maybeFinally(Promise.reject(new Error('boom')), () => {
      ran = true;
    });

    await expect(result).rejects.toThrow('boom');
    expect(ran).toBe(true);
  });
});

describe('maybeAll', () => {
  it('returns all-sync values synchronously', () => {
    const result = maybeAll([1, 'a', true]);

    expect(result).not.toBeInstanceOf(Promise);
    expect(result).toEqual([1, 'a', true]);
  });

  it('returns a fresh array on the sync path', () => {
    const values = [1, 2];

    expect(maybeAll(values)).not.toBe(values);
  });

  it('awaits all values when any is a promise', async () => {
    const result = maybeAll([1, Promise.resolve(2), 3]);

    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toEqual([1, 2, 3]);
  });

  it('rejects when any promise rejects', async () => {
    await expect(maybeAll([1, Promise.reject(new Error('boom'))])).rejects.toThrow('boom');
  });

  it('returns an empty array for empty input', () => {
    expect(maybeAll([])).toEqual([]);
  });
});

describe('maybeAllSettled', () => {
  it('wraps all-sync values as fulfilled results synchronously', () => {
    const result = maybeAllSettled([1, 'a']);

    expect(result).not.toBeInstanceOf(Promise);
    expect(result).toEqual([
      { status: 'fulfilled', value: 1 },
      { status: 'fulfilled', value: 'a' },
    ]);
  });

  it('settles all values when any is a promise', async () => {
    const boom = new Error('boom');
    const result = maybeAllSettled([1, Promise.reject(boom), Promise.resolve(3)]);

    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toEqual([
      { status: 'fulfilled', value: 1 },
      { status: 'rejected', reason: boom },
      { status: 'fulfilled', value: 3 },
    ]);
  });
});
