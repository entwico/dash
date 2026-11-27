/**
 * The loose shape of an email address: `anything@anything.anything`, no whitespace, one `@`.
 * Deliberately not stricter: a stricter check locks out addresses with an umlaut, an IDN domain or
 * an unusual character.
 */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Whether the value has the shape of an email address, see {@link EMAIL_PATTERN}. */
export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value);
}
