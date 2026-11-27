/** The value, or the bound it is beyond: never below `min`, never above `max`. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
