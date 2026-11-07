export type Emphasis = 'neutral' | 'strong' | 'quiet';

export type CellEmphasis = 'rank' | 'key' | 'figure';

export interface Figure {
  label: string;
  value: string;
  emphasis?: Emphasis;
}

export interface Column<T> {
  label: string;
  emphasis?: CellEmphasis;
  text: (row: T, index: number) => string | number;
}

export interface Section<Row> {
  title: string;
  rows: Row[];
  notes?: string[];
}
