import { CARGO_FIELDS, ITINERARY_FIELDS, type CharterParty, type ResolvedCharterParty } from '#features/charterparty/CharterPartyTerms.ts';
import type { Port } from '#features/ports/Port.ts';
import { parcelFit, type ParcelFit, type VesselCandidate, type VesselParticulars } from '#features/vessel/VesselCandidate.ts';
import { carriersOf, type VesselType } from '#features/vessel/vessel.data.ts';
import { completed, demandedFields, type FieldSpec } from '#shared/fields.ts';

export interface SearchSettings {
  maxShortLoad: number | null;
  minUtilisation: number | null;
}

export const DEFAULT_SEARCH_SETTINGS: SearchSettings = {
  maxShortLoad: 0.1,
  minUtilisation: 0.7,
};

export const SEARCH_FIELDS = [
  { kind: 'percent', id: 'maxShortLoad', label: 'Maximum Short Load', max: 1, empty: 'demand' },
  { kind: 'percent', id: 'minUtilisation', label: 'Minimum Utilisation', max: 1, empty: 'demand' },
] as const satisfies readonly FieldSpec<SearchSettings>[];

const SEARCH_TERMS = [...CARGO_FIELDS, ...ITINERARY_FIELDS] as const;

export interface SearchScope {
  loadPort: Port;
  vesselTypes: readonly VesselType[];
}

export interface ScreeningCriteria {
  parcel: number;
  draftLimit: number;
  maxShortLoad: number;
  minUtilisation: number;
}

export interface SearchResult {
  candidates: VesselCandidate[];
  failures: number;
  missing: number;
}

export interface Shortlisted extends VesselCandidate {
  fit: ParcelFit;
}

export interface ScreeningResult {
  candidates: Shortlisted[];
  tooSmall: number;
  tooLarge: number;
}

export function missingSearchFields(charterParty: CharterParty, settings: SearchSettings): string[] {
  return [...demandedFields(SEARCH_TERMS, charterParty), ...demandedFields(SEARCH_FIELDS, settings)];
}

export function searchScope({ cargo, loadPort }: ResolvedCharterParty): SearchScope | null {
  return cargo && loadPort ? { loadPort, vesselTypes: carriersOf(cargo.cargoClass) } : null;
}

export function scopeKey(scope: SearchScope | null): string {
  return scope ? `${scope.loadPort.code}:${scope.vesselTypes.join()}` : '';
}

export function screeningCriteria(charterParty: CharterParty, { draftLimit }: ResolvedCharterParty, settings: SearchSettings): ScreeningCriteria | null {
  const terms = completed(SEARCH_TERMS, charterParty);
  const limits = completed(SEARCH_FIELDS, settings);
  if (!terms || !limits || draftLimit === null) return null;
  return {
    parcel: terms.quantity,
    draftLimit,
    maxShortLoad: limits.maxShortLoad,
    minUtilisation: limits.minUtilisation,
  };
}

export function screenCandidates(search: SearchResult, criteria: ScreeningCriteria): ScreeningResult {
  const screening: ScreeningResult = { candidates: [], tooSmall: 0, tooLarge: 0 };
  for (const candidate of search.candidates) {
    const fit = parcelFit(criteria.parcel, candidate.particulars.deadweight);
    if (fit.shortLoad > criteria.maxShortLoad) screening.tooSmall += 1;
    else if (fit.utilisation < criteria.minUtilisation) screening.tooLarge += 1;
    else screening.candidates.push({ ...candidate, fit });
  }
  return screening;
}

export function exceedsDraftLimit({ maxDraft }: VesselParticulars, draftLimit: number): boolean {
  return maxDraft !== null && maxDraft > draftLimit;
}
