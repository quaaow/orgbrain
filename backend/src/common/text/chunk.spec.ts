import { chunkText } from './chunk';

describe('chunkText', () => {
  it('returns an empty array for empty or whitespace-only input', () => {
    expect(chunkText('')).toEqual([]);
    expect(chunkText('   \n  \t ')).toEqual([]);
  });

  it('returns a single trimmed chunk for short text', () => {
    expect(chunkText('  hello world  ')).toEqual(['hello world']);
  });

  it('splits long text into multiple chunks, each within the size limit', () => {
    const text = 'a'.repeat(10_000);
    const chunks = chunkText(text, 4000, 300);

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(4000);
    }
  });

  it('produces overlapping chunks so context is not lost at boundaries', () => {
    const text = 'a'.repeat(10_000);
    const chunks = chunkText(text, 4000, 300);

    const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
    // With overlap, the combined length exceeds the original input length.
    expect(totalLength).toBeGreaterThan(10_000);
  });

  it('breaks on natural sentence boundaries when possible', () => {
    const text = 'This is a sentence. '.repeat(400); // well over 4000 chars
    const chunks = chunkText(text);

    expect(chunks.length).toBeGreaterThan(1);
    // The first chunk should end on a sentence boundary, not mid-word.
    expect(chunks[0].trimEnd().endsWith('.')).toBe(true);
  });
});
