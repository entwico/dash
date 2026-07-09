import type { ReadonlyDeep } from './readonly-deep';

/**
 * Runtime companion of {@link ReadonlyDeep}: recursively Object.freeze()s a value and returns it
 * typed as deeply readonly. Safe on cyclic structures; already-frozen values are assumed to be
 * deep-frozen and are not descended into.
 *
 * Runtime limits (the type still forbids mutation in all these cases): Map / Set contents are
 * frozen, but the containers themselves stay mutable; Date internals cannot be frozen; functions
 * are left untouched.
 */
export function deepFreeze<T>(value: T): ReadonlyDeep<T> {
  freeze(value);

  return value as ReadonlyDeep<T>;
}

function freeze(value: unknown): void {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) {
    return;
  }

  // freezing typed arrays with elements throws
  if (ArrayBuffer.isView(value)) {
    return;
  }

  Object.freeze(value);

  if (value instanceof Map) {
    for (const [key, item] of value) {
      freeze(key);
      freeze(item);
    }

    return;
  }

  if (value instanceof Set) {
    for (const item of value) {
      freeze(item);
    }

    return;
  }

  for (const key of Reflect.ownKeys(value)) {
    freeze((value as Record<PropertyKey, unknown>)[key]);
  }
}
