export function sumOf<T>(items: readonly T[], value: (item: T) => number): number {
  return items.reduce((sum, item) => sum + value(item), 0);
}

export function recordOf<K extends string, V>(keys: readonly K[], value: (key: K) => V): Record<K, V> {
  return Object.fromEntries(keys.map((key) => [key, value(key)])) as Record<K, V>;
}

export function mapValues<K extends string, V, W>(record: Record<K, V>, transform: (value: V, key: K) => W): Record<K, W> {
  return recordOf(Object.keys(record) as K[], (key) => transform(record[key], key));
}

export function uniqueBy<T>(items: readonly T[], key: (item: T) => unknown): T[] {
  const seen = new Set<unknown>();
  return items.filter((item) => {
    const value = key(item);
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}
