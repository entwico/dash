/** The distinct values of the array, in the order they first appear. */
export function uniq<T>(array: readonly T[]): T[] {
  return [...new Set(array)];
}

/**
 * The items with distinct keys, in the order they first appear: of several items with the same key
 * the first one stays. The key selector is a property name or a function.
 */
export function uniqBy<T>(array: readonly T[], keyFn: keyof T | ((value: T) => unknown)): T[] {
  const seen = new Set<unknown>();

  return array.filter((item) => {
    const key = typeof keyFn === 'function' ? keyFn(item) : item[keyFn];

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });
}
