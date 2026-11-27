/**
 * JSON that is safe to write into an inline `<script>`: a value may contain `</script>`, so every
 * `<` is escaped and cannot end the tag. A value JSON has no form for (`undefined`, a function)
 * becomes `null`.
 */
export function jsonForScript(value: unknown): string {
  const json = JSON.stringify(value) as string | undefined;

  return (json ?? 'null').replaceAll('<', String.raw`\u003c`);
}
