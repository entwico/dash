export type MaybePromise<T> = T | Promise<T>;

type MaybeAwaitedAll<T extends readonly MaybePromise<unknown>[]> = { -readonly [K in keyof T]: Awaited<T[K]> };

type MaybeSettledAll<T extends readonly MaybePromise<unknown>[]> = {
  -readonly [K in keyof T]: PromiseSettledResult<Awaited<T[K]>>;
};

/**
 * Chains a transformation on a MaybePromise value.
 * If the value is a Promise, uses .then(). Otherwise, calls fn directly.
 *
 * @example
 * ```ts
 * const result = maybeThen(map.get('key'), (value) => value.name);
 * // result is MaybePromise<string>
 * ```
 */
export function maybeThen<T, R>(value: MaybePromise<T>, fn: (v: T) => MaybePromise<R>): MaybePromise<R> {
  if (value instanceof Promise) {
    return value.then(fn); // eslint-disable-line unicorn/prefer-await
  }

  return fn(value);
}

/**
 * Adds error handling to a MaybePromise value.
 * If the value is a Promise, uses .catch(). Otherwise, returns value as-is.
 *
 * @example
 * ```ts
 * const result = maybeCatch(map.get('key'), (err) => defaultValue);
 * // result is MaybePromise<T>
 * ```
 */
export function maybeCatch<T>(value: MaybePromise<T>, fn: (e: unknown) => MaybePromise<T>): MaybePromise<T> {
  if (value instanceof Promise) {
    return value.catch(fn); // eslint-disable-line unicorn/prefer-await
  }

  return value;
}

/**
 * Combines MaybePromise values.
 * If any value is a Promise, behaves like Promise.all(). Otherwise, returns the values synchronously.
 *
 * @example
 * ```ts
 * const [user, config] = await maybeAll([cache.get('user'), cache.get('config')]);
 * // no microtask hop when both were cached synchronously
 * ```
 */
export function maybeAll<T extends readonly MaybePromise<unknown>[]>(values: T): MaybePromise<MaybeAwaitedAll<T>> {
  if (values.some((value) => value instanceof Promise)) {
    return Promise.all(values) as Promise<MaybeAwaitedAll<T>>;
  }

  return [...values] as MaybeAwaitedAll<T>;
}

/**
 * Settles MaybePromise values.
 * If any value is a Promise, behaves like Promise.allSettled(). Otherwise, returns the values
 * synchronously, each wrapped as a fulfilled result.
 */
export function maybeAllSettled<T extends readonly MaybePromise<unknown>[]>(
  values: T,
): MaybePromise<MaybeSettledAll<T>> {
  if (values.some((value) => value instanceof Promise)) {
    return Promise.allSettled(values) as Promise<MaybeSettledAll<T>>;
  }

  return values.map((value) => ({ status: 'fulfilled', value })) as MaybeSettledAll<T>;
}
