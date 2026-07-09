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

| Export                                                     | Purpose                                                                                                             |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `createAsyncIterableSubject()` / `AsyncIterableSubject<T>` | multicast source with `next` / `error` / `complete`, consumable via `for await` or `subscribe(observerOrNext)`      |
| `firstAsync(iter)`                                         | first yielded value, then disposes the iterator; throws if the iterable completes empty (≈ `firstValueFrom`)        |
| `mapAsync(iter, fn)` / `filterAsync(iter, predicate)`      | lazy operators over an `AsyncIterable`                                                                              |
| `concatAsync(iter)`                                        | concatenate all yielded arrays into one (plain collection: `Array.fromAsync`)                                       |
| `exponentialBackoff(attempt, options?)`                    | jittered exponential delay, abortable; bounds configurable via `maxDelayMs` / `jitterMinMs` / `jitterMaxMs`         |
| `retryWithBackoff(fn, options?)`                           | retry `fn` with exponential backoff indefinitely until it resolves, abortable via `signal`                          |
| `keepalive(factory, options?)`                             | keep a long-running `AsyncIterable` alive: re-subscribe with backoff on error or completion, stop on `signal` abort |

## Match (`@entwico/dash/match`)

A pattern union that keeps cheap checks cheap — `startsWith` beats a regex when a prefix is all you need:

```ts
import { type StringPattern, createMatcher } from "@entwico/dash/match";

const isExcluded = createMatcher([{ exact: "/favicon.ico" }, { prefix: "/_astro/" }, { suffix: ".map" }, { includes: "/internal/" }, { pattern: /^\/api\/v\d+\// }, (path) => path.length > 2000]);

isExcluded("/_astro/chunk.js"); // true
```

`createMatcher` buckets patterns by check cost at creation time: all `exact` patterns collapse into a single `Set` lookup, then prefixes / suffixes / substrings, then regexps and functions. For one-shot checks there are `matches(value, pattern)` and `matchesAny(value, patterns)`.

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

## License

MIT
