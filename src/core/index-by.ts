export function indexBy<T>(array: readonly T[], keyFn: keyof T | ((value: T) => string)): Map<string, T>;
export function indexBy<T, K extends keyof T>(
  array: readonly T[],
  keyFn: keyof T | ((value: T) => string),
  valueFn: K,
): Map<string, T[K]>;
export function indexBy<T, V>(
  array: readonly T[],
  keyFn: keyof T | ((value: T) => string),
  valueFn: (value: T) => V,
): Map<string, V>;
export function indexBy<T, V = T>(
  array: readonly T[],
  keyFn: keyof T | ((value: T) => string),
  valueFn?: keyof T | ((value: T) => V),
): Map<string, V | T> {
  return array.reduce((map, item) => {
    const key = typeof keyFn === 'function' ? keyFn(item) : String(item[keyFn]);

    if (valueFn) {
      const value = typeof valueFn === 'function' ? valueFn(item) : item[valueFn];
      map.set(key, value as V | T);
    } else {
      map.set(key, item as V | T);
    }

    return map;
  }, new Map<string, V | T>());
}
