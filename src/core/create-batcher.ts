/** Collects items and hands them to `onFlush` together once `delayMs` passes without a new one. */
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
