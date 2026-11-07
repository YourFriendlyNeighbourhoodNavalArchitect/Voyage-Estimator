export type KeysOf<T, V> = { [K in keyof T]-?: T[K] extends V ? K : never }[keyof T] & string;

export type FigureKey<T> = KeysOf<T, number | null>;

export type FigureReader<T> = (key: FigureKey<T>) => number;

/** A figure that was read while empty, named by the model it belongs to and its key there. */
export type Blank<M> = { [S in keyof M & string]: { source: S; key: FigureKey<M[S]> } }[keyof M & string];

/**
 * Reads the figures of several models. An empty figure reads as zero and is
 * recorded as a blank, so only the figures a calculation actually needs are
 * reported missing.
 */
export function figureReaders<M extends Record<string, object>>(models: M) {
  const blanks = new Map<string, Blank<M>>();
  const reader =
    <S extends keyof M & string>(source: S): FigureReader<M[S]> =>
    (key) => {
      const value = models[source][key] as number | null;
      if (value !== null) return value;
      blanks.set(`${source}.${key}`, { source, key } as unknown as Blank<M>);
      return 0;
    };
  return { reader, blanks: () => [...blanks.values()] };
}
