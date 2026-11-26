# @entwico/dash

Typical reusable utilities shared across projects — the canonical home for the small helpers.

- **ESM-only**, `sideEffects: false`, fully tree-shakable
- **Zero-dependency core** — heavier worlds (React, Tailwind) are isolated behind subpath exports with optional peer dependencies

## Installation

```sh
pnpm add @entwico/dash
```

## Entry points

| Entry                 | Contents                             | Peer dependencies              |
| --------------------- | ------------------------------------ | ------------------------------ |
| `@entwico/dash`       | zero-dependency utilities and types  | —                              |
| `@entwico/dash/async` | AsyncIterable primitives and backoff | —                              |
| `@entwico/dash/match` | performant string pattern matching   | —                              |
| `@entwico/dash/cn`    | `cn()` class name merging            | `clsx` ≥2, `tailwind-merge` ≥2 |
| `@entwico/dash/react` | React hooks                          | `react` ≥18                    |
| `@entwico/dash/testing` | helpers for tests of what stays in memory | —                         |
| `@entwico/dash/testing/node` | request contexts and servers that stop answering, for tests on Node | — |

All peer dependencies are optional — install only what the entry points you use need.

## Core (`@entwico/dash`)

| Export                                           | Purpose                                                                                                        |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `assert(expr, message?)`                         | assertion with `asserts expr` narrowing; `message` may be a string or an `Error`                               |
| `capitalize(str)`                                | uppercase the first letter                                                                                     |
| `createBatcher(onFlush, delayMs)`                | batch calls into one flush after a delay                                                                       |
| `debounce(fn, wait)`                             | classic trailing debounce                                                                                      |
| `deepFreeze(value)`                              | recursive `Object.freeze`, returns `ReadonlyDeep<T>`                                                           |
| `defined(val)` / `truthy(val)`                   | type-guard filters for `null` / `undefined` / falsy                                                            |
| `indexBy(array, keyFn, valueFn?)`                | index an array into a `Map`; key/value selectors are property names or functions                               |
| `mapConcurrent(items, fn, concurrency)`          | order-preserving concurrent map with a bounded worker pool                                                     |
| `maybeThen(value, fn)` / `maybeCatch(value, fn)` | chain transformations on `MaybePromise` values without unwrapping                                              |
| `maybeAll(values)` / `maybeAllSettled(values)`   | `Promise.all` / `Promise.allSettled` over `MaybePromise` values, synchronous when all values are               |
| `noop` / `markAsUsed`                            | no-op functions                                                                                                |
| `omitUndefined(obj, recursive?)`                 | strip `undefined` properties (deep by default)                                                                 |
| `optionalize(fn, options?)`                      | lift a function to accept `null` / `undefined`; `defaultValue` / `strategy` (`'nullish'` \| `'falsy'`) options |
| `retry(fn, options?)`                            | retry with a fixed delay; `retries` / `delayMs` / `signal` / `onError` options                                 |
| `sleep(ms, signal?)`                             | promise-based delay, abortable via `AbortSignal`                                                               |

Types: `MaybePromise<T>`, `ReadonlyDeep<T>`.

## Async (`@entwico/dash/async`)

Zero-dependency streaming and retry primitives — the rxjs patterns without rxjs:

| Export                                                     | Purpose                                                                                                                                    |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `createAsyncIterableSubject()` / `AsyncIterableSubject<T>` | multicast source with `next` / `error` / `complete`, consumable via `for await` or `subscribe(observerOrNext)`                             |
| `firstAsync(iter)`                                         | first yielded value; throws if the iterable completes empty (≈ `firstValueFrom`)                               |
| `mapAsync(iter, fn)` / `filterAsync(iter, predicate)`      | lazy operators over an `AsyncIterable`                                                                                                     |
| `concatAsync(iter)`                                        | concatenate all yielded arrays into one                                                              |
| `mergeAsync(sources)`                                      | merge multiple `AsyncIterable`s into one; completes when all complete, errors when any errors (≈ `merge`)                                  |
| `debounceAsync(iter, ms)`                                  | rolling debounce: yield the latest value after `ms` of silence; a slow consumer only sees the most recent settled value (≈ `debounceTime`) |
| `exponentialBackoff(attempt, options?)`                    | jittered exponential delay, abortable; bounds configurable via `maxDelayMs` / `jitterMinMs` / `jitterMaxMs`                                |
| `retryWithBackoff(fn, options?)`                           | retry `fn` with exponential backoff indefinitely until it resolves, abortable via `signal`                                                 |
| `intervalAsync(ms)`                                        | periodic tick stream yielding 0, 1, 2, … every `ms` (≈ `interval`)                                |
| `keepalive(factory, options?)`                             | keep a long-running `AsyncIterable` alive: re-subscribe with backoff on error or completion, stop on `signal` abort                        |

## Match (`@entwico/dash/match`)

A pattern union for matching strings:

```ts
import { type StringPattern, createMatcher } from "@entwico/dash/match";

const isExcluded = createMatcher([{ exact: "/favicon.ico" }, { prefix: "/_astro/" }, { suffix: ".map" }, { includes: "/internal/" }, { pattern: /^\/api\/v\d+\// }, (path) => path.length > 2000]);

isExcluded("/_astro/chunk.js"); // true
```

`createMatcher` compiles a pattern set once for repeated checks. For one-shot checks there are `matches(value, pattern)` and `matchesAny(value, patterns)`.

## cn (`@entwico/dash/cn`)

```ts
import { type Classable, cn } from "@entwico/dash/cn";

cn("p-2", condition && "p-4"); // tailwind conflicts resolved in favor of the last class
```

`Classable` is the `{ className?: string }` contract for component props designed to be merged via `cn()`.

## React (`@entwico/dash/react`)

- `useDebouncedValue(value, delay)` — the value, updated only after it has stayed unchanged for the given delay
- `useEffectAfterMount(effect, deps?)` — run the effect on updates, skip the initial mount
- `useEffectOnce(effect)` — run the effect exactly once on mount
- `useIsMobile()` — whether the viewport is below the mobile breakpoint (768px); `false` during SSR

## Testing (`@entwico/dash/testing`)

Helpers for tests that prove something is not kept in memory. They need `gc()`, so the tests run with `--expose-gc` (vitest: `test.execArgv: ['--expose-gc']`).

```ts
import { countAlive } from "@entwico/dash/testing";

// the objects live in this function only: a test that held them would be what keeps them
function readMany(cache: Cache): WeakRef<object>[] {
  return Array.from({ length: 20 }, (_, id) => new WeakRef(cache.read(id)));
}

it("keeps nothing of an entry that was cleared", async () => {
  const entries = readMany(cache);

  cache.clear();

  expect(await countAlive(entries)).toBe(0);
});
```

- `countAlive(refs, options?)` — how many of the weakly referenced objects survive garbage collection; collects up to `rounds` times (30), `pauseMs` (10) apart
- `collectGarbage()` — one full collection; throws when `gc()` is not exposed

## Testing on Node (`@entwico/dash/testing/node`)

Helpers that need Node: request contexts for the memory tests above, and servers that stop answering, for tests of timeouts, keep-alives and reconnects over real sockets.

```ts
import { countAlive } from "@entwico/dash/testing";
import { closeTestServers, runInContexts, startProxy, startSilentServer } from "@entwico/dash/testing/node";

afterEach(closeTestServers);

it("keeps nothing of the requests that read it", async () => {
  const requests = await runInContexts(50, () => cache.get("key"));

  expect(await countAlive(requests)).toBe(0);
});

it("reconnects when the path to the server goes dead", async () => {
  const proxy = await startProxy(serverPort);
  const client = connect(proxy.port);

  proxy.kill("swallow"); // no error, no close, only silence

  await expect(client.request()).resolves.toBeDefined();
});

it("gives up a server that never answers", async () => {
  const silent = await startSilentServer();

  await expect(call(silent.port)).rejects.toThrow("deadline");
});
```

- `runInContexts(count, operation)` — runs the operation in `count` async contexts of their own, like request handlers, and returns weak references to the contexts for `countAlive`
- `startProxy(targetPort, targetHost?)` — a tcp hop that can stop carrying its connections without closing them: `kill('swallow')` drops both directions, `kill('stall')` stops reading; `readStalled()` lets a stalled connection see that its client left
- `startSilentServer(onData?)` — takes every connection and never answers or closes; `onData` answers by hand up to the step where it goes silent
- `trackSockets(server)` — `open()` and `accepted()` connection counts of any `net` server, to tell a closed socket from an abandoned one
- `closeTestServers()` — ends everything these helpers started; `onCloseTestServers(close)` adds to it, `listenLocally(server)` listens on a free local port

## License

MIT
