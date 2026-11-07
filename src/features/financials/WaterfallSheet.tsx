import { ChartColumn, TrendingUp } from 'lucide-react';
import { useEstimator } from '#estimator/store.ts';
import { Sheet, SheetSection } from '#shared/ui/Sheet.tsx';
import { ledger } from './ledger.ts';
import { BAR_FILLS, waterfallGeometry, type CaptionRole, type WaterfallLayout } from './waterfall.ts';

const LAYOUT: WaterfallLayout = { width: 900, plotHeight: 240, padding: 20, fontSize: 9 };

const CAPTION_INKS: Record<CaptionRole, string> = { total: 'fill-gold-300 font-bold', value: 'fill-ink-300', label: 'fill-ink-400' };

export function WaterfallSheet() {
  const estimate = useEstimator().active?.estimate;
  if (!estimate) return null;
  const { width, height, axis, connectors, bars, captions } = waterfallGeometry(ledger(estimate), LAYOUT);

  return (
    <Sheet icon={ChartColumn} title="Profit Waterfall">
      <SheetSection title="Gross Revenue to Net Profit" icon={TrendingUp} columns={1}>
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full min-w-160 bg-navy-950 rounded-control select-none"
            fontSize={LAYOUT.fontSize}
            textAnchor="middle"
          >
            <line {...axis} className="stroke-navy-700" />
            {connectors.map((rule) => (
              <line key={rule.x1} {...rule} className="stroke-navy-700" strokeDasharray="3 3" />
            ))}
            {bars.map(({ key, tone, ...box }) => (
              <rect key={key} {...box} rx="2" fill={BAR_FILLS.screen[tone]} />
            ))}
            {captions.map(({ key, role, text, x, y }) => (
              <text key={key} x={x} y={y} className={CAPTION_INKS[role]}>
                {text}
              </text>
            ))}
          </svg>
        </div>
      </SheetSection>
    </Sheet>
  );
}
