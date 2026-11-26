import { describe, expect, it } from 'vitest';

import { createAsyncIterableSubject } from './async/async-iterable-subject';
import { debounceAsync } from './async/debounce-async';
import { filterAsync } from './async/filter-async';
import { keepalive } from './async/keepalive';
import { mapAsync } from './async/map-async';
import { mergeAsync } from './async/merge-async';
import { createBatcher } from './core/create-batcher';
import { debounce } from './core/debounce';
import { retry } from './core/retry';
import { sleep } from './core/sleep';
import { countAlive } from './testing';

// what must not stay in memory once it is done: subjects, signals and debounced functions live for
// the life of a process, so whatever they keep of one use, they keep of all of them

type Payload = { id: number; data: number[] };

function createPayload(id: number): Payload {
  return { id, data: Array.from({ length: 1000 }, () => id) };
}

/** Emits payloads the caller does not keep, and answers with weak references to them. */
function emit(subject: { next: (value: Payload) => void }, count: number): WeakRef<object>[] {
  return Array.from({ length: count }, (_, id) => {
    const payload = createPayload(id);

    subject.next(payload);

    return new WeakRef(payload);
  });
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 5));

describe('a subject that stays open', () => {
  it('keeps nothing of a value its consumers took', async () => {
    const subject = createAsyncIterableSubject<Payload>();
    const iterator = subject[Symbol.asyncIterator]();
    let seen = 0;

    subject.subscribe(() => seen++);

    const values = emit(subject, 20);

    for (let read = 0; read < 20; read++) {
      await iterator.next();
    }

    expect(seen).toBe(20);
    expect(await countAlive(values)).toBe(0);
  });

  it('keeps nothing of a listener that unsubscribed', async () => {
    const subject = createAsyncIterableSubject<Payload>();
    const listeners = Array.from({ length: 20 }, () => {
      const listener = { next: () => {} };

      subject.subscribe(listener)();

      return new WeakRef(listener);
    });

    expect(await countAlive(listeners)).toBe(0);
  });

  it('keeps nothing for an iterator that was left, the values it had not read included', async () => {
    const subject = createAsyncIterableSubject<Payload>();
    const unread: WeakRef<object>[] = [];

    void (async () => {
      for await (const _value of subject) {
        // values that arrive while this one is handled wait in the queue of the iterator
        unread.push(...emit(subject, 20));

        break;
      }
    })();

    subject.next(createPayload(0));
    await tick();

    expect(unread).toHaveLength(20);
    expect(await countAlive([...unread, ...emit(subject, 20)])).toBe(0);
  });

  it('keeps nothing for an iterator that was closed while it waited', async () => {
    const subject = createAsyncIterableSubject<Payload>();
    const iterator = subject[Symbol.asyncIterator]();
    const waiting = iterator.next();

    await iterator.return?.();

    await expect(waiting).resolves.toEqual({ value: undefined, done: true });
    expect(await countAlive(emit(subject, 20))).toBe(0);
  });
});

describe.each(['complete', 'error'] as const)('a subject that ended (%s)', (end) => {
  it('keeps nothing of its consumers', async () => {
    const subject = createAsyncIterableSubject<Payload>();
    const consumers: WeakRef<object>[] = [];

    // a block would keep the bindings alive in the async frame; only a function scope lets them be collected
    // eslint-disable-next-line unicorn/prefer-block-statement-over-iife
    (() => {
      const listener = { next: () => {}, error: () => {} };
      const iterator = subject[Symbol.asyncIterator]();

      consumers.push(new WeakRef(listener), new WeakRef(iterator));
      subject.subscribe(listener);
    })();

    const unread = emit(subject, 20);

    if (end === 'complete') {
      subject.complete();
    } else {
      subject.error(new Error('ended'));
    }

    expect(await countAlive([...consumers, ...unread])).toBe(0);
  });
});

describe.each([
  ['mapAsync', (source: AsyncIterable<Payload>) => mapAsync(source, (value) => value)],
  ['filterAsync', (source: AsyncIterable<Payload>) => filterAsync(source, () => true)],
  ['mergeAsync', (source: AsyncIterable<Payload>) => mergeAsync([source, source])],
  ['debounceAsync', (source: AsyncIterable<Payload>) => debounceAsync(source, 1)],
  ['keepalive', (source: AsyncIterable<Payload>) => keepalive(() => source)],
] as const)('%s over a source that stays open', (_name, derive) => {
  it('lets go of the source when the loop over it is left', async () => {
    const subject = createAsyncIterableSubject<Payload>();
    let left = false;

    void (async () => {
      for await (const _value of derive(subject)) {
        break;
      }

      left = true;
    })();

    await tick();
    subject.next(createPayload(0));
    await expect.poll(() => left).toBe(true);

    // a source that still had the loop as a consumer would queue these for it
    expect(await countAlive(emit(subject, 20))).toBe(0);
  });
});

describe.each([
  ['mapAsync', (source: AsyncIterable<Payload>) => mapAsync(source, (value) => value)],
  ['filterAsync', (source: AsyncIterable<Payload>) => filterAsync(source, () => true)],
  ['mergeAsync', (source: AsyncIterable<Payload>) => mergeAsync([source])],
  ['debounceAsync', (source: AsyncIterable<Payload>) => debounceAsync(source, 1)],
] as const)('%s over a source that stays open', (_name, derive) => {
  it('closes the source when it is closed while it waits for a value', async () => {
    const subject = createAsyncIterableSubject<Payload>();
    let closed = false;

    const source: AsyncIterable<Payload> = {
      [Symbol.asyncIterator]() {
        const iterator = subject[Symbol.asyncIterator]();

        return {
          next: () => iterator.next(),
          return: async () => {
            closed = true;

            return await iterator.return!();
          },
        };
      },
    };

    const iterator = derive(source)[Symbol.asyncIterator]();
    const waiting = iterator.next();

    await tick();
    await iterator.return?.();

    await expect(waiting).resolves.toEqual({ value: undefined, done: true });
    expect(closed).toBe(true);
    expect(await countAlive(emit(subject, 20))).toBe(0);
  });
});

describe('keepalive that was aborted', () => {
  it('lets go of a source that has nothing to say', async () => {
    const subject = createAsyncIterableSubject<Payload>();
    const controller = new AbortController();
    let ended = false;

    const stream = keepalive(() => subject, { signal: controller.signal });

    void (async () => {
      for await (const _value of stream) {
        // waits for the first value
      }

      ended = true;
    })();

    await tick();
    controller.abort();

    await expect.poll(() => ended).toBe(true);
    expect(await countAlive(emit(subject, 20))).toBe(0);
  });
});

describe('a signal that stays open', () => {
  it('keeps nothing of a sleep that is over', async () => {
    const { signal } = new AbortController();
    const sleeps = Array.from({ length: 20 }, () => new WeakRef(sleep(1, signal)));

    expect(await countAlive(sleeps)).toBe(0);
  });

  it('keeps nothing of a retry that is over', async () => {
    const { signal } = new AbortController();
    const errors: WeakRef<object>[] = [];

    for (let index = 0; index < 20; index++) {
      let attempts = 0;

      await retry(() => {
        if (attempts++ > 0) {
          return;
        }

        const error = new Error('first attempt');

        errors.push(new WeakRef(error));

        throw error;
      }, { delayMs: 1, signal });
    }

    expect(await countAlive(errors)).toBe(0);
  });
});

describe('a function that stays in use', () => {
  it('debounced, keeps nothing of a call that ran or was replaced', async () => {
    const debounced = debounce((_payload: Payload) => {}, 1);

    expect(await countAlive(emit({ next: debounced }, 20))).toBe(0);
  });

  it('batched, keeps nothing of the items it flushed', async () => {
    const add = createBatcher<Payload>(() => {}, 1);

    expect(await countAlive(emit({ next: add }, 20))).toBe(0);
  });
});
