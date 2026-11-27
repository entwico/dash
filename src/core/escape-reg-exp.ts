/**
 * Escapes the characters that have a meaning in a regular expression, so the text matches itself:
 * `new RegExp(escapeRegExp(userInput))`.
 */
export function escapeRegExp(text: string): string {
  return text.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}
