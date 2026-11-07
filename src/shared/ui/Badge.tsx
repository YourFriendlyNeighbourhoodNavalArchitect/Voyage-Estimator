import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Glyph } from './Glyph.tsx';

export function Badge({ icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className="text-note px-2.5 py-1 rounded-full bg-gold-500/10 text-gold-300 border border-gold-500/40 flex items-center gap-1.5">
      <Glyph icon={icon} size="sm" accent />
      {children}
    </span>
  );
}
