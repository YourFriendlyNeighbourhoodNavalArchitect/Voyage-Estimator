import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Glyph } from './Glyph.tsx';

export function Alert({ children }: { children: ReactNode }) {
  return (
    <div className="p-3 bg-gold-500/10 border border-gold-600/50 rounded-panel text-xs text-gold-300 flex items-start gap-2">
      <div className="mt-0.5 flex">
        <Glyph icon={AlertTriangle} />
      </div>
      <div>{children}</div>
    </div>
  );
}
