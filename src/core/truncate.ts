/**
 * Cuts text that is longer than `max` characters and ends it with `…`. The result is never longer
 * than `max`, the ellipsis included, and has no whitespace before the ellipsis.
 */
export function truncate(text: string, max: number): string {
  if (text.length <= max) {
    return text;
  }

  return `${text.slice(0, Math.max(max - 1, 0)).trimEnd()}…`;
}
