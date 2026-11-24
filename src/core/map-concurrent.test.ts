import { describe, expect, it } from 'vitest';

import { mapConcurrent } from './map-concurrent';
import { sleep } from './sleep';

describe('mapConcurrent', () => {
  it('preserves input order in the output array', async () => {
    const result = await mapConcurrent(
      [1, 2, 3, 4, 5],
      async (n) => {
        // staggered delays so completion order ≠ input order
        await sleep(20 - n * 3);

        return n * n;
      },
      2,
    );

    expect(result).toEqual([1, 4, 9, 16, 25]);
  });

  it('caps concurrency at the requested limit', async () => {
    let active = 0;
    let observedMax = 0;

    await mapConcurrent(
      [1, 2, 3, 4, 5, 6, 7, 8],
      async () => {
        active++;
        observedMax = Math.max(observedMax, active);
        await sleep(5);
        active--;

        return null;
      },
      3,
    );

    expect(observedMax).toBe(3);
  });

  it('handles empty input', async () => {
    const result = await mapConcurrent<number, number>([], (n) => Promise.resolve(n), 4);

    expect(result).toEqual([]);
  });

  it('caps worker count when concurrency exceeds item count', async () => {
    let spawned = 0;

    await mapConcurrent(
      [1, 2],
      async () => {
        spawned++;
        await sleep(5);

        return null;
      },
      10,
    );

    expect(spawned).toBe(2);
  });

  it('propagates errors via Promise.all', async () => {
    await expect(
      mapConcurrent(
        [1, 2, 3],
        (n) => {
          if (n === 2) {
            throw new Error('boom');
          }

          return Promise.resolve(n);
        },
        2,
      ),
    ).rejects.toThrow('boom');
  });

  it('starts no further item once one has failed', async () => {
    const started: number[] = [];

    const result = mapConcurrent(
      Array.from({ length: 20 }, (_, index) => index),
      async (item) => {
        started.push(item);
        await sleep(5);

        if (item === 1) {
          throw new Error('failed');
        }

        return item;
      },
      2,
    );

    await expect(result).rejects.toThrow('failed');
    await sleep(100);

    // the two that ran when it failed, and the one the other worker had already moved on to
    expect(started.length).toBeLessThanOrEqual(3);
  });
});
