---
"@entwico/dash": patch
---

`keepalive` ends cleanly when aborted: it closes a source that is silent, and no longer throws when the abort hits a backoff wait
