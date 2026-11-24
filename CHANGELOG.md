# @entwico/dash

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
