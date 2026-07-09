export function assert<T>(expr: T, message?: string | Error): asserts expr {
  message ||= 'unknown assertion error';
  message = typeof message === 'string' ? new Error(message) : message;

  if (!expr) {
    throw message;
  }
}
