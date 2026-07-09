export type StringPattern =
  | ((value: string) => boolean)
  | { exact: string }
  | { prefix: string }
  | { suffix: string }
  | { includes: string }
  | { pattern: RegExp };

/**
 * Checks if a string matches a single pattern.
 */
export function matches(value: string, pattern: StringPattern): boolean {
  if (typeof pattern === 'function') {
    return pattern(value);
  }

  if ('exact' in pattern) {
    return value === pattern.exact;
  }

  if ('prefix' in pattern) {
    return value.startsWith(pattern.prefix);
  }

  if ('suffix' in pattern) {
    return value.endsWith(pattern.suffix);
  }

  if ('includes' in pattern) {
    return value.includes(pattern.includes);
  }

  return pattern.pattern.test(value);
}

/**
 * Checks if a string matches any of the patterns.
 * For repeated matching against the same pattern set, prefer {@link createMatcher}.
 */
export function matchesAny(value: string, patterns: readonly StringPattern[]): boolean {
  return patterns.some((pattern) => matches(value, pattern));
}

/**
 * Compiles a pattern set into a matcher function.
 *
 * Patterns are bucketed by check cost at creation time: all `exact` patterns collapse
 * into a single Set lookup, then prefixes / suffixes / substrings run as cheap string
 * checks, and regular expressions and matcher functions run last.
 */
export function createMatcher(patterns: readonly StringPattern[]): (value: string) => boolean {
  const exacts = new Set<string>();
  const prefixes: string[] = [];
  const suffixes: string[] = [];
  const substrings: string[] = [];
  const regexps: RegExp[] = [];
  const fns: ((value: string) => boolean)[] = [];

  for (const pattern of patterns) {
    if (typeof pattern === 'function') {
      fns.push(pattern);
    } else if ('exact' in pattern) {
      exacts.add(pattern.exact);
    } else if ('prefix' in pattern) {
      prefixes.push(pattern.prefix);
    } else if ('suffix' in pattern) {
      suffixes.push(pattern.suffix);
    } else if ('includes' in pattern) {
      substrings.push(pattern.includes);
    } else {
      regexps.push(pattern.pattern);
    }
  }

  return (value) => {
    if (exacts.has(value)) {
      return true;
    }

    return (
      prefixes.some((prefix) => value.startsWith(prefix)) ||
      suffixes.some((suffix) => value.endsWith(suffix)) ||
      substrings.some((substring) => value.includes(substring)) ||
      regexps.some((regexp) => regexp.test(value)) ||
      fns.some((fn) => fn(value))
    );
  };
}
