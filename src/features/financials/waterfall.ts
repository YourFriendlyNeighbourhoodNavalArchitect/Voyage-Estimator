import { sumOf } from '#shared/collections.ts';
import { usdCompact } from '#shared/format.ts';
import { PALETTE } from '#shared/ui/palette.ts';
import type { LedgerGroup } from './ledger.ts';

const LABEL_LINES = 2;
const LINE_SPACING = 1.3;
const GAP_RATIO = 0.3;

export type BarTone = 'total' | 'increase' | 'decrease';

export const BAR_FILLS: Record<'screen' | 'paper', Record<BarTone, string>> = {
  screen: { total: PALETTE.gold[300], increase: PALETTE.gold[500], decrease: PALETTE.gold[700] },
  paper: { total: PALETTE.navy[900], increase: PALETTE.gold[500], decrease: PALETTE.gold[700] },
};

export type CaptionRole = 'value' | 'total' | 'label';

export interface WaterfallLayout {
  width: number;
  plotHeight: number;
  padding: number;
  fontSize: number;
}

interface Step {
  label: string;
  amount: number;
  isTotal: boolean;
}

interface Rule {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface Bar {
  key: string;
  tone: BarTone;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Caption {
  key: string;
  role: CaptionRole;
  text: string;
  x: number;
  y: number;
}

export interface WaterfallGeometry {
  width: number;
  height: number;
  axis: Rule;
  connectors: Rule[];
  bars: Bar[];
  captions: Caption[];
}

function waterfallSteps(groups: readonly LedgerGroup[]): Step[] {
  const counted = groups.filter(({ inResult }) => inResult);
  return [
    ...counted.flatMap(({ rows }) => rows.map(({ label, amount }) => ({ label, amount, isTotal: false }))),
    { label: 'Net Profit', amount: sumOf(counted, ({ total }) => total), isTotal: true },
  ];
}

function labelLines(label: string): string[] {
  const spaces = [...label].flatMap((character, index) => (character === ' ' ? [index] : []));
  if (spaces.length === 0) return [label];
  const middle = label.length / 2;
  const cut = spaces.reduce((best, index) => (Math.abs(index - middle) < Math.abs(best - middle) ? index : best));
  return [label.slice(0, cut), label.slice(cut + 1)];
}

function horizontal(x1: number, x2: number, y: number): Rule {
  return { x1, y1: y, x2, y2: y };
}

export function waterfallGeometry(groups: readonly LedgerGroup[], { width, plotHeight, padding, fontSize }: WaterfallLayout): WaterfallGeometry {
  const steps = waterfallSteps(groups);
  const spans: { from: number; to: number }[] = [];
  for (const { amount, isTotal } of steps) {
    const from = isTotal ? 0 : (spans.at(-1)?.to ?? 0);
    spans.push({ from, to: isTotal ? amount : from + amount });
  }
  const values = spans.flatMap(({ from, to }) => [from, to]);
  const top = Math.max(0, ...values);
  const scale = (plotHeight - 2 * padding) / (top - Math.min(0, ...values) || 1);
  const toY = (value: number) => padding + (top - value) * scale;
  const slot = width / steps.length;
  const barWidth = slot * (1 - GAP_RATIO);
  const lineHeight = fontSize * LINE_SPACING;

  const bars = steps.map(({ label, amount, isTotal }, index): Bar => {
    const { from, to } = spans[index];
    return {
      key: `${index}-${label}`,
      tone: isTotal ? 'total' : amount >= 0 ? 'increase' : 'decrease',
      x: index * slot + (slot - barWidth) / 2,
      y: toY(Math.max(from, to)),
      width: barWidth,
      height: Math.max(1, Math.abs(toY(from) - toY(to))),
    };
  });

  const captions = steps.flatMap(({ label, amount, isTotal }, index): Caption[] => {
    const { key, x, y } = bars[index];
    const centre = x + barWidth / 2;
    return [
      { key: `${key}-value`, role: isTotal ? 'total' : 'value', text: usdCompact(amount), x: centre, y: y - fontSize / 2 },
      ...labelLines(label).map((text, line): Caption => ({ key: `${key}-label-${line}`, role: 'label', text, x: centre, y: plotHeight + lineHeight * (line + 1) })),
    ];
  });

  return {
    width,
    height: plotHeight + lineHeight * LABEL_LINES + fontSize / 2,
    axis: horizontal(0, width, toY(0)),
    connectors: bars.slice(1).map((bar, index) => horizontal(bars[index].x + barWidth, bar.x, toY(spans[index].to))),
    bars,
    captions,
  };
}
