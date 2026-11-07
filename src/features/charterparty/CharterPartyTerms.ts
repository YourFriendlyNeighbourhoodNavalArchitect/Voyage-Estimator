import { DRY_BULK, findCargo, WET_BULK } from '#features/cargo/cargo.data.ts';
import type { CargoProfile } from '#features/cargo/CargoProfile.ts';
import { limitingDraft, portChoices, type Port } from '#features/ports/Port.ts';
import { findPort, PORTS } from '#features/ports/ports.data.ts';
import { sumOf } from '#shared/collections.ts';
import type { ChoiceGroup, FieldSpec } from '#shared/fields.ts';

export const CHARTER_TYPES = ['Voyage Charter', 'Time Charter'] as const;
type CharterType = (typeof CHARTER_TYPES)[number];

export interface CharterTerms {
  rate: { label: string; unit: string; digits: number };
  revenue: string;
  basis: 'tonnes' | 'days';
  ownerPaysVoyageExpenses: boolean;
}

export const CHARTER_TERMS: Record<CharterType, CharterTerms> = {
  'Voyage Charter': {
    rate: { label: 'Freight Rate', unit: '$/tonne', digits: 2 },
    revenue: 'Gross Freight',
    basis: 'tonnes',
    ownerPaysVoyageExpenses: true,
  },
  'Time Charter': {
    rate: { label: 'Daily Hire', unit: '$/day', digits: 0 },
    revenue: 'Gross Hire',
    basis: 'days',
    ownerPaysVoyageExpenses: false,
  },
};

export interface CharterParty {
  charterType: CharterType;
  cargoName: string;
  quantity: number | null;
  loadPortCode: string;
  dischargePortCode: string;
  loadingDuration: number | null;
  dischargingDuration: number | null;
  earningRate: number | null;
  addressCommission: number;
  brokerageCommission: number;
}

export const COMMISSIONS = ['addressCommission', 'brokerageCommission'] as const;

export type Commission = (typeof COMMISSIONS)[number];

export const DEFAULT_CHARTER_PARTY: CharterParty = {
  charterType: 'Voyage Charter',
  cargoName: '',
  quantity: null,
  loadPortCode: '',
  dischargePortCode: '',
  loadingDuration: null,
  dischargingDuration: null,
  earningRate: null,
  addressCommission: 0.0125,
  brokerageCommission: 0.025,
};

const CARGO_CHOICES: readonly ChoiceGroup[] = [
  { label: 'Dry Bulk', choices: DRY_BULK.map((cargo) => cargo.name) },
  { label: 'Wet Bulk', choices: WET_BULK.map((cargo) => cargo.name) },
];

const PORT_CHOICES = portChoices(PORTS);

export const CARGO_FIELDS = [
  { kind: 'select', id: 'cargoName', label: 'Cargo', options: CARGO_CHOICES, placeholder: 'Select Cargo', empty: 'demand' },
  { kind: 'number', id: 'quantity', label: 'Quantity', unit: 'tonnes', positive: true, empty: 'demand' },
] as const satisfies readonly FieldSpec<CharterParty>[];

export const ITINERARY_FIELDS = [
  { kind: 'select', id: 'loadPortCode', label: 'Loading Port', options: PORT_CHOICES, placeholder: 'Select Port', empty: 'demand' },
  { kind: 'select', id: 'dischargePortCode', label: 'Discharging Port', options: PORT_CHOICES, placeholder: 'Select Port', empty: 'demand' },
  { kind: 'number', id: 'loadingDuration', label: 'Loading Duration', unit: 'days', digits: 1, empty: 'zero' },
  { kind: 'number', id: 'dischargingDuration', label: 'Discharging Duration', unit: 'days', digits: 1, empty: 'zero' },
] as const satisfies readonly FieldSpec<CharterParty>[];

export function moneyFields(charterType: CharterType): readonly FieldSpec<CharterParty>[] {
  return [
    { kind: 'number', id: 'earningRate', ...CHARTER_TERMS[charterType].rate, empty: 'zero' },
    { kind: 'percent', id: 'addressCommission', label: 'Address Commission', max: 1, empty: 0 },
    { kind: 'percent', id: 'brokerageCommission', label: 'Brokerage Commission', max: 1, empty: 0 },
  ];
}

export function charterPartyFields(charterParty: CharterParty): readonly FieldSpec<CharterParty>[] {
  return [...CARGO_FIELDS, ...ITINERARY_FIELDS, ...moneyFields(charterParty.charterType)];
}

export function totalCommission(charterParty: CharterParty): number {
  return sumOf(COMMISSIONS, (commission) => charterParty[commission]);
}

export function reviseCharterParty(charterParty: CharterParty, patch: Partial<CharterParty>): CharterParty {
  const revised = { ...charterParty, ...patch };
  return revised.charterType === charterParty.charterType ? revised : { ...revised, earningRate: null };
}

export interface ResolvedCharterParty {
  cargo: CargoProfile | null;
  loadPort: Port | null;
  dischargePort: Port | null;
  draftLimit: number | null;
}

export function resolveCharterParty({ cargoName, loadPortCode, dischargePortCode }: CharterParty): ResolvedCharterParty {
  const loadPort = findPort(loadPortCode);
  const dischargePort = findPort(dischargePortCode);
  return { cargo: findCargo(cargoName), loadPort, dischargePort, draftLimit: limitingDraft(loadPort, dischargePort) };
}
