/**
 * Split a long text into overlapping chunks suitable for LLM extraction.
 *
 * Tries to break on paragraph / sentence boundaries to avoid cutting ideas in
 * half, falling back to a hard character split for very long unbroken spans.
 */
export function chunkText(
  text: string,
  maxChars = 4000,
  overlapChars = 300,
): string[] {
  const clean = text.trim();
  if (clean.length <= maxChars) {
    return clean.length > 0 ? [clean] : [];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < clean.length) {
    let end = Math.min(start + maxChars, clean.length);

    if (end < clean.length) {
      // Prefer a paragraph break, then a sentence break, within the tail of
      // the window so chunks end on natural boundaries.
      const window = clean.slice(start, end);
      const searchFrom = Math.floor(maxChars * 0.5);
      const breakAt = Math.max(
        window.lastIndexOf('\n\n', end),
        window.lastIndexOf('. ', end),
        window.lastIndexOf('\n', end),
      );
      if (breakAt > searchFrom) {
        end = start + breakAt + 1;
      }
    }

    const piece = clean.slice(start, end).trim();
    if (piece) {
      chunks.push(piece);
    }

    if (end >= clean.length) {
      break;
    }
    start = Math.max(end - overlapChars, start + 1);
  }

  return chunks;
}
