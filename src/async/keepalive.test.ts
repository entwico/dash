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
});
