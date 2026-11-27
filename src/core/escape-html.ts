const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '\'': '&#39;',
};

/**
 * Escapes text for HTML: safe as element content and inside a quoted attribute value, single or
 * double quoted.
 */
export function escapeHtml(text: string): string {
  return text.replaceAll(/[&<>"']/g, (char) => HTML_ENTITIES[char]!);
}
