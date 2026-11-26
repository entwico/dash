type DeepNonUndefined<T> =
  T extends Record<string, unknown>
    ? {
        [P in keyof T as undefined extends T[P] ? never : P]: T[P] extends (infer U)[]
          ? DeepNonUndefined<U>[]
          : T[P] extends Record<string, unknown>
            ? DeepNonUndefined<T[P]>
            : Exclude<T[P], undefined>;
      }
    : Exclude<T, undefined>;

type ShallowNonUndefined<T> = {
  [P in keyof T as undefined extends T[P] ? never : P]: Exclude<T[P], undefined>;
};

/**
 * Removes undefined properties from an object.
 * Optionally processes nested objects and arrays recursively.
 *
 * @param obj object to clean
 * @param recursive whether to recursively process nested objects and arrays (default: true)
 */
export function omitUndefined<T extends Record<string, unknown>>(obj: T, recursive?: true): DeepNonUndefined<T>;
export function omitUndefined<T extends Record<string, unknown>>(obj: T, recursive: false): ShallowNonUndefined<T>;
export function omitUndefined<T extends Record<string, unknown>>(
  obj: T,
  recursive = true,
): DeepNonUndefined<T> | ShallowNonUndefined<T> {
  const result = {} as DeepNonUndefined<T> | ShallowNonUndefined<T>;

  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (recursive && value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        (result as Record<string, unknown>)[key] = omitUndefined(value as Record<string, unknown>, recursive);
      } else if (recursive && Array.isArray(value)) {
        (result as Record<string, unknown>)[key] = value
          .filter((item) => item !== undefined)
          .map((item) => {
            if (item && typeof item === 'object' && !Array.isArray(item) && !(item instanceof Date)) {
              return omitUndefined(item as Record<string, unknown>, recursive);
            }
            return item;
          });
      } else {
        (result as Record<string, unknown>)[key] = value;
      }
    }
  }

  return result;
}
