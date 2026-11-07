import type { LucideIcon } from 'lucide-react';
import type { Emphasis, Figure } from '#shared/display.ts';
import { Glyph } from './Glyph.tsx';
import { Panel } from './Panel.tsx';

const EMPHASIS_INKS: Record<Emphasis, string> = { strong: 'text-gold-300', quiet: 'text-ink-400', neutral: 'text-ink-0' };

export function StatTile({
  label,
  value,
  icon,
  boxed = false,
  emphasis = 'neutral',
}: Figure & { icon?: LucideIcon; boxed?: boolean }) {
  const body = (
    <>
      <div className="text-note text-ink-400 flex items-center gap-1.5 mb-1">
        {icon && <Glyph icon={icon} size="sm" accent />}
        {label}
      </div>
      <div className={`tabular-nums ${boxed ? 'font-bold text-lg' : 'font-semibold text-sm'} ${EMPHASIS_INKS[emphasis]}`}>{value}</div>
    </>
  );
  return boxed ? <Panel className="p-3">{body}</Panel> : <div>{body}</div>;
}
