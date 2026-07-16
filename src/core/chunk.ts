import { assert } from './assert';

/**
 * Splits `array` into contiguous chunks of at most `size` items, preserving order.
 * The final chunk holds the remainder when the length is not an exact multiple.
 * Throws when `size` is not a positive number.
 */
export function chunk<T>(array: readonly T[], size: number): T[][] {
  assert(size > 0, 'chunk size must be greater than 0');

  const chunks: T[][] = [];

  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }

  return chunks;
}
