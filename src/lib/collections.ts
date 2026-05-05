export function sampleShuffled<T>(items: T[], count = items.length): T[] {
  const result = [...items];
  const limit = Math.min(count, result.length);

  for (let i = 0; i < limit; i += 1) {
    const j = i + Math.floor(Math.random() * (result.length - i));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.slice(0, limit);
}
