import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { Glyph } from './Glyph.tsx';

export function ProgressNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-xs text-ink-400">
      <Glyph icon={Loader2} size="sm" spin />
      {children}
    </div>
  );
}
