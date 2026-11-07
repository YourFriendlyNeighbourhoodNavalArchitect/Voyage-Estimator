import { nearestBunkerPort, type FuelPrices } from '#features/bunkers/bunkerPrices.ts';
import { DEFAULT_CHARTER_PARTY, resolveCharterParty, reviseCharterParty, type CharterParty, type ResolvedCharterParty } from '#features/charterparty/CharterPartyTerms.ts';
import { DEFAULT_ROUTING_SETTINGS, type RoutingSettings } from '#features/routing/routingService.ts';
import { DEFAULT_SEARCH_SETTINGS, scopeKey, screeningCriteria, searchScope, type ScreeningCriteria, type SearchScope, type SearchSettings } from '#features/screening/vesselScreening.ts';
import type { VesselParticulars } from '#features/vessel/VesselCandidate.ts';
import { reviseVesselProfile, vesselProfile, type VesselProfile } from '#features/vessel/VesselProfile.ts';

export interface State {
  charterParty: CharterParty;
  resolved: ResolvedCharterParty;
  searchSettings: SearchSettings;
  routingSettings: RoutingSettings;
  searchRequest: { scope: SearchScope; count: number } | null;
  bunker: { port: string; overrides: Partial<FuelPrices> };
  vesselProfiles: Record<number, VesselProfile>;
  selectedImo: number | null;
}

export const INITIAL_STATE: State = {
  charterParty: DEFAULT_CHARTER_PARTY,
  resolved: resolveCharterParty(DEFAULT_CHARTER_PARTY),
  searchSettings: DEFAULT_SEARCH_SETTINGS,
  routingSettings: DEFAULT_ROUTING_SETTINGS,
  searchRequest: null,
  bunker: { port: '', overrides: {} },
  vesselProfiles: {},
  selectedImo: null,
};

export type Action =
  | { type: 'patchCharterParty'; patch: Partial<CharterParty> }
  | { type: 'patchSearchSettings'; patch: Partial<SearchSettings> }
  | { type: 'patchRoutingSettings'; patch: Partial<RoutingSettings> }
  | { type: 'requestSearch' }
  | { type: 'setBunkerPort'; port: string }
  | { type: 'patchBunkerPrices'; patch: Partial<FuelPrices> }
  | { type: 'patchVessel'; imo: number; patch: Partial<VesselProfile> }
  | { type: 'select'; particulars: VesselParticulars };

type Terms = Pick<State, 'charterParty' | 'resolved' | 'searchSettings'>;

export function criteriaOf({ charterParty, resolved, searchSettings }: Terms): ScreeningCriteria | null {
  return screeningCriteria(charterParty, resolved, searchSettings);
}

export function searchableScope(terms: Terms): SearchScope | null {
  const scope = searchScope(terms.resolved);
  return scope && criteriaOf(terms) ? scope : null;
}

function withBunkerPort(state: State, port: string): State {
  return port === state.bunker.port ? state : { ...state, bunker: { port, overrides: {} } };
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'patchCharterParty': {
      const charterParty = reviseCharterParty(state.charterParty, action.patch);
      const resolved = resolveCharterParty(charterParty);
      let next: State = { ...state, charterParty, resolved };
      if (scopeKey(searchScope(resolved)) !== scopeKey(searchScope(state.resolved))) next = { ...next, searchRequest: null, selectedImo: null };
      if (resolved.loadPort !== state.resolved.loadPort) next = withBunkerPort(next, nearestBunkerPort(resolved.loadPort));
      return next;
    }
    case 'patchSearchSettings':
      return { ...state, searchSettings: { ...state.searchSettings, ...action.patch } };
    case 'patchRoutingSettings':
      return { ...state, routingSettings: { ...state.routingSettings, ...action.patch } };
    case 'requestSearch': {
      const scope = searchableScope(state);
      return scope ? { ...state, searchRequest: { scope, count: (state.searchRequest?.count ?? 0) + 1 } } : state;
    }
    case 'setBunkerPort':
      return withBunkerPort(state, action.port);
    case 'patchBunkerPrices':
      return { ...state, bunker: { ...state.bunker, overrides: { ...state.bunker.overrides, ...action.patch } } };
    case 'patchVessel': {
      const profile = state.vesselProfiles[action.imo];
      if (!profile) return state;
      return { ...state, vesselProfiles: { ...state.vesselProfiles, [action.imo]: reviseVesselProfile(profile, action.patch) } };
    }
    case 'select': {
      const { imo } = action.particulars;
      if (imo === state.selectedImo) return state;
      const profile = state.vesselProfiles[imo] ?? vesselProfile(action.particulars);
      return { ...state, selectedImo: imo, vesselProfiles: { ...state.vesselProfiles, [imo]: profile } };
    }
  }
}
