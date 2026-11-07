import type { ReactNode } from 'react';

export function Panel({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`bg-navy-950/60 border border-gold-500/15 rounded-panel p-3.5 ${className}`}>{children}</div>;
}
