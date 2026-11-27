/**
 * The message of whatever was thrown: `error.message` for an `Error`, otherwise `fallback`, or the
 * value as a string when there is no fallback.
 */
export function errorMessage(error: unknown, fallback?: string | undefined): string {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback ?? String(error);
}
