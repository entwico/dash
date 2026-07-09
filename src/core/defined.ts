export function defined<T>(val: T | undefined | null | void): val is T {
  return val !== undefined && val !== null;
}

export function truthy<T>(val: T | undefined | null | void): val is T {
  return !!val;
}
