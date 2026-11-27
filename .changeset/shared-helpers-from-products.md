---
'@entwico/dash': minor
---

New helpers, collected from the copies spread across the product repos.

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
