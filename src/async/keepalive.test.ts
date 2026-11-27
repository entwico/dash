import { describe, expect, it, vi } from 'vitest';

import { keepalive } from './keepalive';

async function* fromArray<T>(values: T[]): AsyncIterable<T> {
  for (const v of values) {
    yield v;
  }
}

describe('keepalive', () => {
  it('re-subscribes after the source completes', async () => {
    let count = 0;
    const factory = (): AsyncIterable<number> => fromArray([++count]);
    const controller = new AbortController();
    const out: number[] = [];

    const stream = keepalive(factory, { signal: controller.signal });

    void (async () => {
      for await (const v of stream) {
        out.push(v);

        if (v >= 3) {
          controller.abort();
        }
      }
    })();

    await vi.waitFor(() => expect(out).toEqual([1, 2, 3]));
  });

  it('stops cleanly when signal aborts', async () => {
    const controller = new AbortController();
    let opens = 0;
    const factory = (): AsyncIterable<number> => {
      opens++;

      return fromArray([opens]);
    };

    const out: number[] = [];
    const stream = keepalive(factory, { signal: controller.signal });

    const done = (async () => {
      for await (const v of stream) {
        out.push(v);
        controller.abort();
      }
    })();

    await done;

    expect(out).toEqual([1]);
  });

  it('stops cleanly when signal aborts during a backoff wait', async () => {
    const controller = new AbortController();
    let opens = 0;

    const factory = (): AsyncIterable<number> => ({
      [Symbol.asyncIterator]: () => ({
        next: () => {
          opens++;

          return Promise.reject(new Error('source failed'));
        },
      }),
    });

    const stream = keepalive(factory, { signal: controller.signal });

    const done = (async () => {
      for await (const _value of stream) {
        // the source never yields
      }
    })();

    // the source has failed by now, and the first backoff takes over a second
    await new Promise((resolve) => setTimeout(resolve, 50));
    controller.abort();

    await expect(done).resolves.toBeUndefined();
    expect(opens).toBe(1);
  });
});

describe('keepalive over a source that fails', () => {
  const noJitter = { jitterMinMs: 0, jitterMaxMs: 0 };

  /** A source that fails as long as `fails()` says so, then yields the number of its subscription. */
  function createFlakySource(fails: (opens: number) => boolean) {
    let opens = 0;

    const factory = (): AsyncIterable<number> => {
      const subscription = ++opens;

      return (async function* () {
        if (fails(subscription)) {
          throw new Error('source failed');
        }

        yield subscription;
      })();
    };

    return { factory, opens: () => opens };
  }

  it('re-subscribes after the error, waiting twice as long after every failure in a row', async () => {
    vi.useFakeTimers();

    try {
      const controller = new AbortController();
      const source = createFlakySource((opens) => opens <= 3);
      const out: number[] = [];

      const stream = keepalive(source.factory, { ...noJitter, signal: controller.signal });

      const done = (async () => {
        for await (const value of stream) {
          out.push(value);
          controller.abort();
        }
      })();

      await vi.advanceTimersByTimeAsync(999);
      expect(source.opens()).toBe(1);

      await vi.advanceTimersByTimeAsync(1);
      expect(source.opens()).toBe(2);

      await vi.advanceTimersByTimeAsync(1999);
      expect(source.opens()).toBe(2);

      await vi.advanceTimersByTimeAsync(1);
      expect(source.opens()).toBe(3);

      await vi.advanceTimersByTimeAsync(4000);
      await done;

      expect(out).toEqual([4]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('starts over with the short wait once a value arrived', async () => {
    vi.useFakeTimers();

    try {
      const controller = new AbortController();
      // fails twice, yields, then fails again
      const source = createFlakySource((opens) => opens !== 3);
      const out: number[] = [];

      const stream = keepalive(source.factory, { ...noJitter, signal: controller.signal });

      void (async () => {
        for await (const value of stream) {
          out.push(value);
        }
      })();

      await vi.advanceTimersByTimeAsync(3000);
      expect(out).toEqual([3]);
      expect(source.opens()).toBe(4);

      // a third failure in a row would wait 4s
      await vi.advanceTimersByTimeAsync(1000);
      expect(source.opens()).toBe(5);

      controller.abort();
    } finally {
      vi.useRealTimers();
    }
  });

  it('never passes the error on to its consumer', async () => {
    vi.useFakeTimers();

    try {
      const controller = new AbortController();
      const source = createFlakySource((opens) => opens === 1);

      const stream = keepalive(source.factory, { ...noJitter, signal: controller.signal });
      const first = stream[Symbol.asyncIterator]().next();

      await vi.advanceTimersByTimeAsync(1000);

      await expect(first).resolves.toEqual({ value: 2, done: false });

      controller.abort();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('keepalive after the abort', () => {
  it('yields no value the source still had', async () => {
    const controller = new AbortController();
    const out: number[] = [];
    const stream = keepalive(() => fromArray([1, 2, 3]), { signal: controller.signal });

    for await (const value of stream) {
      out.push(value);
      controller.abort();
    }

    expect(out).toEqual([1]);
  });

  it('ends without a wait when the source fails', async () => {
    const controller = new AbortController();
    let opens = 0;

    const factory = (): AsyncIterable<number> => {
      opens++;

      return (async function* () {
        yield 1;

        throw new Error('source failed');
      })();
    };

    const out: number[] = [];
    const stream = keepalive(factory, { signal: controller.signal });

    for await (const value of stream) {
      out.push(value);
      controller.abort();
    }

    expect(out).toEqual([1]);
    expect(opens).toBe(1);
  });

  it('yields nothing for a signal that was aborted from the start', async () => {
    const factory = vi.fn(() => fromArray([1]));

    await expect(Array.fromAsync(keepalive(factory, { signal: AbortSignal.abort() }))).resolves.toEqual([]);
    expect(factory).not.toHaveBeenCalled();
  });
});
