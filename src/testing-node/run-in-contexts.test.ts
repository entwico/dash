import { describe, expect, it } from 'vitest';

import { countAlive } from '../testing';

import { runInContexts } from './run-in-contexts';

describe('runInContexts', () => {
  it('runs the operation once per context, one after the other', async () => {
    const order: string[] = [];

    const contexts = await runInContexts(3, async (index) => {
      order.push(`start ${index}`);
      await new Promise((resolve) => setTimeout(resolve, 1));
      order.push(`end ${index}`);
    });

    expect(contexts).toHaveLength(3);
    expect(order).toEqual(['start 0', 'end 0', 'start 1', 'end 1', 'start 2', 'end 2']);
  });

  it('answers with contexts nothing holds once the operation is over', async () => {
    const contexts = await runInContexts(10, () => new Promise((resolve) => setTimeout(resolve, 1)));

    expect(await countAlive(contexts)).toBe(0);
  });

  it('answers with contexts that stay alive for what outlives the operation', async () => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // a timer keeps its context for as long as the timer itself is held, by this test included
    const clearTimers = () => {
      for (const timer of timers) {
        clearTimeout(timer);
      }

      timers.length = 0;
    };

    // a timer belongs to the async context it was created in
    const contexts = await runInContexts(10, (index) => {
      if (index < 3) {
        timers.push(setTimeout(() => {}, 60_000));
      }
    });

    expect(await countAlive(contexts, { rounds: 5 })).toBe(3);

    clearTimers();

    expect(await countAlive(contexts)).toBe(0);
  });

  it('passes on the error of the operation', async () => {
    await expect(runInContexts(1, () => Promise.reject(new Error('failed')))).rejects.toThrow('failed');
  });
});
