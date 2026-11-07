import type { ReactNode } from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';
import { Glyph } from './Glyph.tsx';

const VARIANTS = {
  primary: 'bg-gold-600 hover:bg-gold-500 text-navy-950 disabled:bg-navy-800 disabled:text-ink-500',
  secondary: 'bg-navy-800 hover:bg-navy-700 text-ink-200 border border-gold-600/30 disabled:opacity-40',
} as const;

const SIZES = { md: 'px-4 py-1.5 text-sm gap-2', sm: 'px-3 py-1.5 text-xs gap-1.5' } as const;

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  busy = false,
  fill = false,
  disabled = false,
  onClick,
  children,
}: {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  icon?: LucideIcon;
  busy?: boolean;
  fill?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  const glyph = busy ? Loader2 : icon;
  return (
    <button
      type="button"
      disabled={disabled || busy || !onClick}
      onClick={onClick}
      className={`${SIZES[size]} ${fill ? 'w-full h-control self-end' : ''} rounded-control font-medium transition flex items-center justify-center cursor-pointer disabled:cursor-not-allowed shadow-sm ${VARIANTS[variant]}`}
    >
      {glyph && <Glyph icon={glyph} size={size} spin={busy} />}
      {children}
    </button>
  );
}
