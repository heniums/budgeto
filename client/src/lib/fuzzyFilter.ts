export function fuzzyFilter<T>(
  items: readonly T[],
  query: string,
  getText: (item: T) => string,
): T[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [...items];
  return items.filter((item) => {
    const text = getText(item).toLowerCase();
    let index = 0;
    for (const char of normalized) {
      index = text.indexOf(char, index);
      if (index === -1) return false;
      index += 1;
    }
    return true;
  });
}
