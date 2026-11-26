export type MaybePromise<T> = T | Promise<T>;

type MaybeAwaitedAll<T extends readonly MaybePromise<unknown>[]> = { -readonly [K in keyof T]: Awaited<T[K]> };

type MaybeSettledAll<T extends readonly MaybePromise<unknown>[]> = {
  -readonly [K in keyof T]: PromiseSettledResult<Awaited<T[K]>>;
};

/**
 * Chains a transformation on a MaybePromise value, mirroring `Promise.prototype.then`.
 * If the value is a Promise, uses `.then(onFulfilled, onRejected)`. Otherwise, calls
 * `onFulfilled` directly — a synchronous value has no rejection branch, so `onRejected`
 * only ever runs on the async path.
 *
 * @example
 * ```ts
 * const result = maybeThen(map.get('key'), (value) => value.name);
 * // result is MaybePromise<string>
 *
 * const safe = maybeThen(load(), (v) => v.name, () => 'anonymous');
 * // handles both branches in a single promise on the async path
 * ```
 */
export function maybeThen<T, R>(
  value: MaybePromise<T>,
  onFulfilled: (v: T) => MaybePromise<R>,
  onRejected?: ((e: unknown) => MaybePromise<R>) | undefined,
): MaybePromise<R> {
  if (value instanceof Promise) {
    // .catch() would also route errors thrown by onFulfilled into onRejected
    return value.then(onFulfilled, onRejected); // eslint-disable-line unicorn/prefer-await, unicorn/prefer-then-catch
  }

  return onFulfilled(value);
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
 * Runs a callback once a MaybePromise settles, regardless of outcome, mirroring
 * `Promise.prototype.finally`. If the value is a Promise, uses `.finally()`; otherwise
 * calls `onFinally` synchronously. The original value/reason is passed through unchanged.
 *
 * @example
 * ```ts
 * const result = maybeFinally(fetchRows(), () => spinner.stop());
 * // spinner stops whether fetchRows resolves or rejects; no extra transform
 * ```
 */
export function maybeFinally<T>(value: MaybePromise<T>, onFinally: () => void): MaybePromise<T> {
  if (value instanceof Promise) {
    return value.finally(onFinally); // eslint-disable-line unicorn/prefer-await
  }

  onFinally();

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
