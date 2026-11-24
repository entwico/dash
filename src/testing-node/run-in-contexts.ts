// the rest of the library is typed without node
/// <reference types="node" />
import { AsyncLocalStorage } from 'node:async_hooks';

type Context = { index: number; payload: number[] };

const contexts = new AsyncLocalStorage<Context>();

/**
 * Runs `operation` `count` times, one after the other, each inside an async context of its own,
 * the way a server runs a request handler. Answers with weak references to the contexts: whatever
 * outlives the operation and was created inside it (a timer, a listener, a pending promise chain)
 * keeps its context alive, and `countAlive` finds it.
 *
 * ```ts
 * const requests = await runInContexts(50, () => cache.get('key'));
 *
 * expect(await countAlive(requests)).toBe(0);
 * ```
 */
export async function runInContexts(
  count: number,
  operation: (index: number) => unknown,
): Promise<WeakRef<object>[]> {
  const refs: WeakRef<object>[] = [];

  for (let index = 0; index < count; index++) {
    // large enough for a leak to show in a heap snapshot as well
    const context: Context = { index, payload: Array.from({ length: 1000 }, () => index) };

    refs.push(new WeakRef(context));
    await contexts.run(context, async () => {
      await operation(index);
    });
  }

  return refs;
}
