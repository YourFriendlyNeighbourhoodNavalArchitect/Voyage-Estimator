import { createContext, useContext, useMemo, useReducer, useState } from 'react';
import { fetchBunkerPrices, NO_FUEL_PRICES, type FuelPrices } from '#features/bunkers/bunkerPrices.ts';
import type { CharterParty, ResolvedCharterParty } from '#features/charterparty/CharterPartyTerms.ts';
import { fetchEmissionRates, NO_EMISSION_RATES } from '#features/environmental/emissionRates.ts';
import { voyageEstimate, type VoyageEstimate } from '#features/financials/VoyageEstimate.ts';
import type { RouteResult } from '#features/routing/RouteResult.ts';
import { computeRoute, type RoutingSettings } from '#features/routing/routingService.ts';
import { scopeKey, screenCandidates, type ScreeningCriteria, type ScreeningResult, type SearchResult, type SearchSettings } from '#features/screening/vesselScreening.ts';
import { searchVessels } from '#features/screening/vesselSearch.ts';
import type { VesselCandidate, VesselSighting } from '#features/vessel/VesselCandidate.ts';
import type { VesselProfile } from '#features/vessel/VesselProfile.ts';
import { asSentence, errorMessage } from '#shared/errors.ts';
import { useResource, type Resource } from '#shared/resource.ts';
import { criteriaOf, INITIAL_STATE, reducer, searchableScope, type State } from './state.ts';

const ROUTE_DELAY_MS = 300;

interface Appraisal {
  vessel: VesselProfile;
  sighting: VesselSighting;
  route: Resource<RouteResult>;
  estimate: VoyageEstimate | null;
}

interface Actions {
  patchCharterParty: (patch: Partial<CharterParty>) => void;
  patchSearchSettings: (patch: Partial<SearchSettings>) => void;
  patchRoutingSettings: (patch: Partial<RoutingSettings>) => void;
  runSearch: () => void;
  setBunkerPort: (port: string) => void;
  patchBunkerPrices: (patch: Partial<FuelPrices>) => void;
  patchVessel: (imo: number, patch: Partial<VesselProfile>) => void;
  select: (candidate: VesselCandidate) => void;
}

interface Store extends Actions {
  state: State;
  resolved: ResolvedCharterParty;
  criteria: ScreeningCriteria | null;
  canSearch: boolean;
  search: Resource<SearchResult>;
  searchProgress: string | null;
  searching: boolean;
  screening: ScreeningResult | null;
  bunkerQuote: FuelPrices | null;
  bunkerPrices: FuelPrices;
  active: Appraisal | null;
}

export const EstimatorContext = createContext<Store | null>(null);

const EMISSION_RATES_QUERY = { subject: 'emissionRates', key: '', load: fetchEmissionRates };

export function useEstimatorStore(): Store {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const { charterParty, resolved, searchSettings, routingSettings, bunker, searchRequest, selectedImo, vesselProfiles } = state;
  const { loadPort, dischargePort } = resolved;

  // --- Market quotes -------------------------------------------------------

  const emissionRates = useResource(EMISSION_RATES_QUERY).data ?? NO_EMISSION_RATES;
  const bunkerQuote = useResource(bunker.port ? { subject: bunker.port, key: '', load: () => fetchBunkerPrices(bunker.port) } : null).data;
  const bunkerPrices = useMemo(() => ({ ...NO_FUEL_PRICES, ...bunkerQuote, ...bunker.overrides }), [bunkerQuote, bunker.overrides]);

  // --- The search ----------------------------------------------------------

  const [searchProgress, setSearchProgress] = useState<string | null>(null);
  const search = useResource<SearchResult>(
    searchRequest && {
      subject: scopeKey(searchRequest.scope),
      key: String(searchRequest.count),
      load: () => {
        setSearchProgress(null);
        return searchVessels(searchRequest.scope, setSearchProgress);
      },
    },
  );
  const criteria = useMemo(() => criteriaOf({ charterParty, resolved, searchSettings }), [charterParty, resolved, searchSettings]);
  const canSearch = useMemo(() => searchableScope({ charterParty, resolved, searchSettings }) !== null, [charterParty, resolved, searchSettings]);
  const searching = search.status === 'loading';
  const screening = useMemo(() => (search.data && criteria ? screenCandidates(search.data, criteria) : null), [search.data, criteria]);

  // --- The selected ship ----------------------------------------------------

  const selected = useMemo(() => search.data?.candidates.find(({ particulars }) => particulars.imo === selectedImo) ?? null, [search.data, selectedImo]);
  const profile = selected ? vesselProfiles[selected.particulars.imo] : undefined;
  const draft = profile?.maxDraft ?? null;
  const { suezAllowed, panamaAllowed } = routingSettings;
  const route = useResource<RouteResult>(
    selected && loadPort && dischargePort
      ? {
          subject: String(selected.particulars.imo),
          key: JSON.stringify([selected.sighting, loadPort.code, dischargePort.code, suezAllowed, panamaAllowed, draft]),
          load: () =>
            computeRoute(selected, loadPort, dischargePort, { suezAllowed, panamaAllowed }, draft).catch((error: unknown) => {
              throw new Error(`The sea route could not be computed. ${asSentence(errorMessage(error))}`, { cause: error });
            }),
        }
      : null,
    ROUTE_DELAY_MS,
  );

  const shortlisted = selected !== null && screening !== null && screening.candidates.some(({ particulars }) => particulars.imo === selected.particulars.imo);

  const active = useMemo<Appraisal | null>(() => {
    if (!shortlisted || !selected || !profile || !loadPort || !dischargePort) return null;
    const estimate =
      route.data &&
      voyageEstimate({ vessel: profile, charterParty, loadPort, dischargePort, route: route.data, routingSettings, fuelPrices: bunkerPrices, emissionRates });
    return { vessel: profile, sighting: selected.sighting, route, estimate };
  }, [shortlisted, selected, profile, loadPort, dischargePort, route, charterParty, routingSettings, bunkerPrices, emissionRates]);

  // --- Actions --------------------------------------------------------------

  const actions = useMemo<Actions>(
    () => ({
      patchCharterParty: (patch) => dispatch({ type: 'patchCharterParty', patch }),
      patchSearchSettings: (patch) => dispatch({ type: 'patchSearchSettings', patch }),
      patchRoutingSettings: (patch) => dispatch({ type: 'patchRoutingSettings', patch }),
      runSearch: () => dispatch({ type: 'requestSearch' }),
      setBunkerPort: (port) => dispatch({ type: 'setBunkerPort', port }),
      patchBunkerPrices: (patch) => dispatch({ type: 'patchBunkerPrices', patch }),
      patchVessel: (imo, patch) => dispatch({ type: 'patchVessel', imo, patch }),
      select: ({ particulars }) => dispatch({ type: 'select', particulars }),
    }),
    [],
  );

  return useMemo(
    () => ({
      ...actions,
      state,
      resolved,
      criteria,
      canSearch,
      search,
      searchProgress: searching ? searchProgress : null,
      searching,
      screening,
      bunkerQuote,
      bunkerPrices,
      active,
    }),
    [actions, state, resolved, criteria, canSearch, search, searchProgress, searching, screening, bunkerQuote, bunkerPrices, active],
  );
}

export function useEstimator(): Store {
  const store = useContext(EstimatorContext);
  if (!store) throw new Error('useEstimator must be used inside EstimatorContext.');
  return store;
}
