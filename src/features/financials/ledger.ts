import { FUEL_PRICE_FIELDS } from '#features/bunkers/bunkerPrices.ts';
import { totalQuantity } from '#features/bunkers/consumption.ts';
import { charterPartyFields, COMMISSIONS, moneyFields } from '#features/charterparty/CharterPartyTerms.ts';
import { EMISSION_RATE_LABELS } from '#features/environmental/emissionRates.ts';
import { SEGMENTS, type Segment } from '#features/routing/duration.ts';
import { VESSEL_FIELD_LIST } from '#features/vessel/VesselProfile.ts';
import { sumOf } from '#shared/collections.ts';
import type { Column, Figure, Section } from '#shared/display.ts';
import { fieldLabel } from '#shared/fields.ts';
import { figure, measure, percent, unitLabel } from '#shared/format.ts';
import { CHARGES, type Charge, type EstimateBlank, type VoyageEstimate } from './VoyageEstimate.ts';

const ESTIMATED = 'Estimated';
const TARIFF_BASIS = 'Tariff Approximation';
const CHARTERER_ACCOUNT = 'Paid by the charterer, so not part of the net profit.';

interface LedgerLine {
  label: string;
  basis: string;
  amount: number;
}

export type LedgerGroupId = 'revenue' | 'voyageExpenses' | 'runningCost';

export interface LedgerGroup extends Section<LedgerLine> {
  id: LedgerGroupId;
  total: number;
  inResult: boolean;
}

interface Passage {
  label: string;
  duration: number;
  consumption: number;
}

const CHARGE_LINES: Record<Charge, { label: string; basis: (estimate: VoyageEstimate) => string }> = {
  portDues: { label: 'Port Dues', basis: () => ESTIMATED },
  agencyFees: { label: 'Agency Fees', basis: () => ESTIMATED },
  suezToll: { label: 'Suez Canal Toll', basis: () => TARIFF_BASIS },
  panamaToll: { label: 'Panama Canal Toll', basis: () => TARIFF_BASIS },
  warRisk: {
    label: 'War Risk Premium',
    basis: ({ inputs: { vessel, routingSettings } }) => `${percent(routingSettings.warRiskPremium)} of ${measure(vessel.hullAndMachineryValue, '$')}`,
  },
  euEts: {
    label: 'EU ETS Allowances',
    basis: ({ etsEmissions, inputs: { emissionRates } }) =>
      `${measure(etsEmissions, 'tCO2e', 1)} × ${measure(emissionRates.allowancePrice, '€/tonne', 2)} × ${measure(emissionRates.euroRate, '$/€', 4)}`,
  },
  fuelEu: { label: 'FuelEU Penalty', basis: () => 'Calculated' },
};

const SEGMENT_LABELS: Record<Segment, string> = {
  ballast: 'Ballast Passage',
  laden: 'Laden Passage',
  loading: 'Loading Port',
  discharge: 'Discharging Port',
  canals: 'Canal Transits',
};

export const LINE_COLUMNS: readonly Column<LedgerLine>[] = [
  { label: 'Item', emphasis: 'key', text: ({ label }) => label },
  { label: 'Basis', text: ({ basis }) => basis },
  { label: unitLabel('Amount', '$'), text: ({ amount }) => figure(amount) },
];

export const PASSAGE_COLUMNS: readonly Column<Passage>[] = [
  { label: 'Segment', emphasis: 'key', text: ({ label }) => label },
  { label: unitLabel('Duration', 'days'), text: ({ duration }) => figure(duration, 1) },
  { label: unitLabel('Consumption', 'tonnes'), text: ({ consumption }) => figure(consumption, 1) },
];

function revenueLines({ inputs: { charterParty }, terms: { revenue: label, basis, rate }, earningBasis, revenue, commissions }: VoyageEstimate): LedgerLine[] {
  const money = moneyFields(charterParty.charterType);
  return [
    { label, basis: `${measure(earningBasis, basis, basis === 'days' ? 1 : 0)} × ${measure(charterParty.earningRate, rate.unit, rate.digits)}`, amount: revenue },
    ...COMMISSIONS.map((commission) => ({
      label: fieldLabel(money, commission),
      basis: percent(charterParty[commission]),
      amount: -commissions[commission],
    })),
  ];
}

function expenseLines(estimate: VoyageEstimate): LedgerLine[] {
  return [
    ...estimate.bunkers.map(({ grade, quantity, price, cost }) => ({
      label: `${grade} Bunkers`,
      basis: `${measure(quantity, 'tonnes', 1)} × ${measure(price, '$/tonne', 2)}`,
      amount: -cost,
    })),
    ...CHARGES.map((charge) => ({ label: CHARGE_LINES[charge].label, basis: CHARGE_LINES[charge].basis(estimate), amount: -estimate.charges[charge] })),
  ];
}

function runningLines({ operatingCost }: VoyageEstimate): LedgerLine[] {
  return [{ label: 'Operating Cost', basis: ESTIMATED, amount: -operatingCost }];
}

function ledgerGroup(id: LedgerGroupId, title: string, lines: LedgerLine[], inResult: boolean): LedgerGroup {
  const rows = lines.filter(({ amount }) => amount !== 0);
  const total = sumOf(rows, ({ amount }) => amount);
  return { id, title, rows, total, inResult, notes: [`Total: ${measure(total, '$')}`, ...(inResult ? [] : [CHARTERER_ACCOUNT])] };
}

export function ledger(estimate: VoyageEstimate): LedgerGroup[] {
  return [
    ledgerGroup('revenue', 'Revenue', revenueLines(estimate), true),
    ledgerGroup('voyageExpenses', 'Voyage Expenses', expenseLines(estimate), estimate.terms.ownerPaysVoyageExpenses),
    ledgerGroup('runningCost', 'Running Cost', runningLines(estimate), true),
  ];
}

export function passages({ days, burns }: VoyageEstimate): Section<Passage> {
  return {
    title: 'Duration and Consumption',
    rows: SEGMENTS.filter((segment) => days[segment] > 0).map((segment) => ({
      label: SEGMENT_LABELS[segment],
      duration: days[segment],
      consumption: totalQuantity(burns.filter(({ stage }) => stage === segment)),
    })),
    notes: [`Total Duration: ${measure(days.total, 'days', 1)}`, `Total Consumption: ${measure(totalQuantity(burns), 'tonnes', 1)}`],
  };
}

export function deadweightAccount({ capacity, fit }: VoyageEstimate): Section<Figure> {
  return {
    title: 'Deadweight Account',
    rows: [
      { label: unitLabel('Cargo Capacity', 'tonnes'), value: figure(capacity) },
      { label: unitLabel('Cargo Lifted', 'tonnes'), value: figure(fit.cargoLifted) },
      { label: 'Utilisation', value: percent(fit.utilisation, 1) },
      { label: 'Short Load', value: percent(fit.shortLoad, 1) },
    ],
  };
}

function blankLabel({ inputs }: VoyageEstimate, blank: EstimateBlank): string {
  switch (blank.source) {
    case 'vessel':
      return fieldLabel(VESSEL_FIELD_LIST, blank.key);
    case 'charterParty':
      return fieldLabel(charterPartyFields(inputs.charterParty), blank.key);
    case 'fuelPrices':
      return fieldLabel(FUEL_PRICE_FIELDS, blank.key);
    case 'emissionRates':
      return EMISSION_RATE_LABELS[blank.key];
  }
}

export function blankWarning(estimate: VoyageEstimate): string | null {
  const labels = estimate.blanks.map((blank) => blankLabel(estimate, blank));
  return labels.length > 0 ? `Empty fields: ${labels.join(', ')}.` : null;
}
