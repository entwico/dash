# @entwico/dash

## 1.5.0

### Minor Changes

- d838265: New helpers, collected from the copies spread across the product repos.
  
  Core (`@entwico/dash`):
  
  - `escapeHtml(text)` — escapes `& < > " '`. The local copies it replaces mostly left `'` alone, so text with an apostrophe now comes out as `&#39;`
  - `errorMessage(error, fallback?)` — `error.message` for an `Error`, otherwise the fallback, or `String(error)` without one
  - `uniq(array)` / `uniqBy(array, keyFn)`
  - `clamp(value, min, max)`
  - `truncate(text, max)` — the result is at most `max` characters, the `…` included
  - `escapeRegExp(text)`
  - `jsonForScript(value)` — JSON for an inline `<script>`; `undefined` becomes `null`
  - `EMAIL_PATTERN` / `isValidEmail(value)`
  
  React (`@entwico/dash/react`):
  
  - `useNow({ intervalMs?, active? })` — ticking clock. The local `useNow(active)` copies become `useNow({ active })`
  - `useScrollLock(locked)` — counted scroll lock. It sets `overflow: hidden` on `<html>` as an inline style, where the local copies toggled the Tailwind class `overflow-hidden`
  - `useCopyToClipboard(resetMs?)`

### Patch Changes

- d838265: `useEffectOnce` keeps what its effect set up under React StrictMode. Before, StrictMode's extra unmount ran the cleanup right after mount and the effect never ran again, so a subscription or listener set up with it was dead in development.
  
  The cleanup now runs a microtask after the unmount instead of during it.

## 1.4.0

### Minor Changes

- 9b89e5d: add `useMediaQuery` to the react hooks; `useIsMobile` now builds on it
- 9b89e5d: add `@entwico/dash/testing` (`collectGarbage`, `countAlive`) and `@entwico/dash/testing/node` (`runInContexts`, `startProxy`, `startSilentServer`, `trackSockets`) for tests of what stays in memory and of servers that stop answering

### Patch Changes

- 9b89e5d: `mapAsync` and `filterAsync` close their source at once when they are closed while waiting for a value
- 9b89e5d: `keepalive` ends cleanly when aborted: it closes a source that is silent, and no longer throws when the abort hits a backoff wait
- 9b89e5d: `mapConcurrent` starts no further item once one has failed

## 1.3.0

### Minor Changes

- 5b560d5: add `chunk` to split an array into fixed-size batches

## 1.2.0

### Minor Changes

- da25010: add optional onRejected to maybeThen and a new maybeFinally

## 1.1.0

### Minor Changes

- 70d75ed: add `mergeAsync`, `debounceAsync`, and `intervalAsync` to `@entwico/dash/async`

## 1.0.0

### Major Changes

- 2d248f7: initial release
