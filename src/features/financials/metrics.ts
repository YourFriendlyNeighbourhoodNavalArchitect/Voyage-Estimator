import type { CharterTerms } from '#features/charterparty/CharterPartyTerms.ts';
import type { Emphasis, Figure } from '#shared/display.ts';
import { figure, percent, signedFigure, signedPercent, unitLabel } from '#shared/format.ts';
import type { VoyageEstimate } from './VoyageEstimate.ts';

export interface Metric {
  label: string;
  digits: number;
  share?: boolean;
  toned?: boolean;
  value: (estimate: VoyageEstimate) => number | null;
}

const HEADLINES = ['timeCharterEquivalent', 'netProfit', 'margin', 'breakEvenRate'] as const;

export type Headline = (typeof HEADLINES)[number];

export function metrics({ rate }: CharterTerms) {
  return {
    timeCharterEquivalent: { label: unitLabel('Time Charter Equivalent', '$/day'), digits: 0, toned: true, value: ({ timeCharterEquivalent }) => timeCharterEquivalent },
    netProfit: { label: unitLabel('Net Profit', '$'), digits: 0, toned: true, value: ({ netProfit }) => netProfit },
    margin: { label: 'Profit Margin', digits: 1, share: true, toned: true, value: ({ margin }) => margin },
    breakEvenRate: { label: unitLabel(`Break-Even ${rate.label}`, rate.unit), digits: rate.digits, value: ({ breakEvenRate }) => breakEvenRate },
    voyageExpenses: { label: unitLabel('Voyage Expenses', '$'), digits: 0, value: ({ voyageExpenses }) => voyageExpenses },
    duration: { label: unitLabel('Voyage Duration', 'days'), digits: 1, value: ({ days }) => days.total },
  } satisfies Record<string, Metric>;
}

export function metricText({ share, digits }: Metric, value: number | null): string {
  return share ? percent(value, digits) : figure(value, digits);
}

export function metricChange({ share, digits }: Metric, change: number | null): string {
  return share ? signedPercent(change, digits) : signedFigure(change, digits);
}

function emphasis(value: number | null): Emphasis {
  return value === null ? 'neutral' : value >= 0 ? 'strong' : 'quiet';
}

export function headlines(estimate: VoyageEstimate): (Figure & { id: Headline })[] {
  const all: Record<Headline, Metric> = metrics(estimate.terms);
  return HEADLINES.map((id) => {
    const metric = all[id];
    const result = metric.value(estimate);
    return { id, label: metric.label, value: metricText(metric, result), emphasis: metric.toned ? emphasis(result) : 'neutral' };
  });
}
