export function optionalize<T, U, D = undefined>(
  fn: (v: T) => U,
  options?: { defaultValue?: D | undefined; strategy?: 'falsy' | 'nullish' | undefined } | undefined,
): (v: T | null | undefined) => U | D {
  const defaultValue = options?.defaultValue;
  const emptyMode = options?.strategy ?? 'nullish';

  return (v: T | null | undefined): U | D => {
    if (v === null || v === undefined || (emptyMode === 'falsy' && !v)) {
      return defaultValue as D;
    }

    return fn(v);
  };
}
