import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Glyph } from './Glyph.tsx';
import { Panel } from './Panel.tsx';

type SectionColumns = 1 | 2 | 3 | 4;

const COLUMN_CLASSES: Record<SectionColumns, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-2 lg:grid-cols-4',
};

export function Sheet({
  icon,
  title,
  actions,
  busy = false,
  children,
}: {
  icon: LucideIcon;
  title: string;
  actions?: ReactNode;
  busy?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="bg-navy-900 border border-gold-500/70 rounded-board p-5 text-ink-0 shadow-soft">
      <fieldset disabled={busy} className="min-w-0 disabled:cursor-progress [&:disabled_*]:cursor-progress!">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-control bg-gold-500/10 text-gold-400 border border-gold-500/40">
              <Glyph icon={icon} />
            </div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-300">{title}</h2>
          </div>
          {actions}
        </div>
        <div className="space-y-3.5">{children}</div>
      </fieldset>
    </div>
  );
}

export function SheetGrid({ columns, children }: { columns: SectionColumns; children: ReactNode }) {
  return <div className={`grid ${COLUMN_CLASSES[columns]} gap-2.5`}>{children}</div>;
}

export function SheetSection({
  title,
  icon,
  columns,
  note,
  children,
}: {
  title: string;
  icon: LucideIcon;
  columns: SectionColumns;
  note?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="text-xs font-semibold text-ink-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
        <Glyph icon={icon} accent /> {title}
      </div>
      <Panel>
        <SheetGrid columns={columns}>{children}</SheetGrid>
        {note && <div className="mt-2">{note}</div>}
      </Panel>
    </section>
  );
}

export function SheetNote({ children }: { children: ReactNode }) {
  return <p className="text-note text-ink-500 leading-relaxed">{children}</p>;
}
