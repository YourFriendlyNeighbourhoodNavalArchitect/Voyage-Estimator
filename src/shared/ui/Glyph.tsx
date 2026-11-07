import type { LucideIcon } from 'lucide-react';

const GLYPH_SIZES = { sm: 'w-3.5 h-3.5', md: 'w-4 h-4' } as const;

export function Glyph({
  icon: Icon,
  size = 'md',
  accent = false,
  spin = false,
}: {
  icon: LucideIcon;
  size?: keyof typeof GLYPH_SIZES;
  accent?: boolean;
  spin?: boolean;
}) {
  return <Icon className={`${GLYPH_SIZES[size]} shrink-0 ${accent ? 'text-gold-400' : ''} ${spin ? 'animate-spin' : ''}`} />;
}
