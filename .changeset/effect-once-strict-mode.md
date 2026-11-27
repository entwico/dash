---
'@entwico/dash': patch
---

`useEffectOnce` keeps what its effect set up under React StrictMode. Before, StrictMode's extra unmount ran the cleanup right after mount and the effect never ran again, so a subscription or listener set up with it was dead in development.

The cleanup now runs a microtask after the unmount instead of during it.
