/**
 * Buffers function calls and executes them together after a specified delay.
 * Useful for batching multiple events into a single operation.
 *
 * @param onFlush - Function to execute with all buffered items
 * @param delayMs - Delay in milliseconds before flushing the buffer
 * @returns Function that adds items to the buffer
 */
export function createBatcher<T>(onFlush: (items: T[]) => void, delayMs: number) {
  let buffer: T[] = [];
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (item: T) => {
    buffer.push(item);

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      onFlush(buffer);
      buffer = [];
      timeoutId = null;
    }, delayMs);
  };
}
