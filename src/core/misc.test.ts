import { describe, expect, it } from 'vitest';

import { assert } from './assert';
import { capitalize } from './capitalize';
import { defined, truthy } from './defined';
import { sleep } from './sleep';

describe('assert', () => {
  it('passes for truthy expressions', () => {
    expect(() => assert(1)).not.toThrow();
  });

  it('throws with the given message', () => {
    expect(() => assert(false, 'nope')).toThrow('nope');
  });

  it('throws the given error', () => {
    const error = new TypeError('typed');

    expect(() => assert(0, error)).toThrow(error);
  });

  it('throws a default message without one', () => {
    expect(() => assert(undefined)).toThrow('unknown assertion error');
  });
});

describe('defined', () => {
  it('filters out null and undefined but keeps falsy values', () => {
    expect([1, null, 0, undefined, ''].filter(defined)).toEqual([1, 0, '']);
  });
});

describe('truthy', () => {
  it('filters out all falsy values', () => {
    expect([1, null, 0, undefined, '', 'x'].filter(truthy)).toEqual([1, 'x']);
  });
});

describe('capitalize', () => {
  it('capitalizes the first letter', () => {
    expect(capitalize('hello')).toBe('Hello');
  });

  it('returns empty strings unchanged', () => {
    expect(capitalize('')).toBe('');
  });
});

describe('sleep', () => {
  it('resolves after the given time', async () => {
    await expect(sleep(1)).resolves.toBeUndefined();
  });

  it('rejects immediately for an already-aborted signal', async () => {
    const controller = new AbortController();

    controller.abort(new Error('aborted'));

    await expect(sleep(1000, controller.signal)).rejects.toThrow(/aborted/);
  });

  it('rejects when the signal aborts during the wait', async () => {
    const controller = new AbortController();
    const promise = sleep(1000, controller.signal);

    controller.abort(new Error('aborted'));

    await expect(promise).rejects.toThrow(/aborted/);
  });
});
