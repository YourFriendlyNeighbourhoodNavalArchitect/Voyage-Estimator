import type { ReactNode } from 'react';

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="py-10 px-6 text-center text-sm text-ink-500 border border-dashed border-gold-500/20 rounded-panel">{children}</div>;
}
