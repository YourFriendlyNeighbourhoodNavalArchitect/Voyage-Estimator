import type { CellEmphasis, Column } from '#shared/display.ts';

const CELL_INKS: Record<CellEmphasis, string> = {
  rank: 'text-gold-400',
  key: 'text-ink-0 font-medium',
  figure: 'text-ink-200',
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  selectedKey = null,
  onSelect,
}: {
  columns: readonly Column<T>[];
  rows: readonly T[];
  rowKey: (row: T) => string | number;
  selectedKey?: string | number | null;
  onSelect?: (row: T) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="text-ink-400 border-b border-gold-500/20">
            {columns.map(({ label }) => (
              <th key={label} className="px-2 py-2 font-medium text-center">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const key = rowKey(row);
            const selected = key === selectedKey;
            return (
              <tr
                key={key}
                aria-selected={onSelect ? selected : undefined}
                onClick={onSelect && (() => onSelect(row))}
                className={`border-b border-gold-500/10 transition ${onSelect ? 'cursor-pointer' : ''} ${
                  selected ? 'bg-gold-500/10' : 'hover:bg-navy-800/60'
                }`}
              >
                {columns.map(({ label, emphasis = 'figure', text }) => (
                  <td
                    key={label}
                    className={`px-2 py-2 text-center tabular-nums ${CELL_INKS[emphasis]}`}
                  >
                    {text(row, index)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
