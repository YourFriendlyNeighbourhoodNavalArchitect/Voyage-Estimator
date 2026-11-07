import type { Passage, SeaRouteMultiFeature } from 'searoute-ts';
import { ECA_ZONES } from 'searoute-ts/eca';
import { inCountries, type Port } from '#features/ports/Port.ts';
import { vesselLabel, type VesselCandidate } from '#features/vessel/VesselCandidate.ts';
import { asSentence } from '#shared/errors.ts';
import type { FieldSpec } from '#shared/fields.ts';
import { greatCircle, insidePolygon, type Coordinates, type Position } from '#shared/geo.ts';
import { LISTED_COUNTRIES, LISTED_WATERS } from './listedAreas.data.ts';
import type { Canal, RouteLeg, RoutePoint, RouteResult } from './RouteResult.ts';

const MAX_SEA_MARGIN = 0.15;

export interface RoutingSettings {
  suezAllowed: boolean;
  panamaAllowed: boolean;
  seaMargin: number;
  warRiskPremium: number;
}

export const DEFAULT_ROUTING_SETTINGS: RoutingSettings = {
  suezAllowed: true,
  panamaAllowed: true,
  seaMargin: 0.05,
  warRiskPremium: 0.01,
};

export const ROUTING_FIELDS: readonly FieldSpec<RoutingSettings>[] = [
  { kind: 'checkbox', id: 'suezAllowed', label: 'Suez Canal', boxLabel: 'Allowed' },
  { kind: 'checkbox', id: 'panamaAllowed', label: 'Panama Canal', boxLabel: 'Allowed' },
  { kind: 'percent', id: 'warRiskPremium', label: 'War Risk Premium', unit: '% of H&M', max: 1, empty: 0 },
  { kind: 'slider', id: 'seaMargin', label: 'Sea Margin', max: MAX_SEA_MARGIN },
];

const CANALS: readonly Canal[] = ['suez', 'panama'];

type Engine = [typeof import('searoute-ts'), typeof import('searoute-ts/marnet-20km')];

let engine: Promise<Engine> | null = null;

export function inEca({ latitude, longitude }: Position): boolean {
  return ECA_ZONES.some(({ bboxes }) =>
    bboxes.some(([west, south, east, north]) => longitude >= west && longitude <= east && latitude >= south && latitude <= north),
  );
}

export async function computeRoute({ particulars, sighting }: VesselCandidate, loadPort: Port, dischargePort: Port, { suezAllowed, panamaAllowed }: Pick<RoutingSettings, 'suezAllowed' | 'panamaAllowed'>, draft: number | null): Promise<RouteResult> {
  const position: RoutePoint = { latitude: sighting.latitude, longitude: sighting.longitude, label: vesselLabel(particulars), code: null };
  const start = portPoint(loadPort);
  const restrictions: Passage[] = [];
  if (!suezAllowed) restrictions.push('suez');
  if (!panamaAllowed) restrictions.push('panama');
  // The ballast leg is a great circle from the reported position to the loading port, not a passage over the maritime
  // network. It can cross land, its distance is a lower bound, its ECA fraction is judged from its two ends only, and it
  // never transits a canal. So the ballast conditions of the Suez and Panama tariffs (see VESSEL_TYPES) and the ballast
  // share of the canal days are never charged, even when the real passage would need a canal. Routing this leg with
  // networkLeg, like the laden one, would make all of them apply.
  const ballast = directLeg(position, start);
  const laden = await networkLeg(start, portPoint(dischargePort), restrictions, draft);
  return { ballast, laden, entersListedArea: entersListedArea(ballast, laden) };
}

function entersListedArea(ballast: RouteLeg, laden: RouteLeg): boolean {
  const ends = [ballast.from, ballast.to, laden.from, laden.to];
  if (ends.some((end) => inCountries(end, LISTED_COUNTRIES))) return true;
  const track = [...ends.map(coordinates), ...ballast.geometry.flat(), ...laden.geometry.flat()];
  return track.some((point) => LISTED_WATERS.some((area) => insidePolygon(point, area)));
}

async function networkLeg(from: RoutePoint, to: RoutePoint, restrictions: Passage[], draft: number | null): Promise<RouteLeg> {
  const [library, { DEFAULT_MARNET: network }] = await loadEngine();

  let feature: SeaRouteMultiFeature;
  try {
    feature = library.seaRoute(coordinates(from), coordinates(to), {
      network,
      restrictions,
      returnPassages: true,
      emissions: true,
      antimeridian: 'split',
      vesselDraftMeters: draft ?? undefined,
    });
  } catch (error) {
    if (error instanceof library.NoRouteError) {
      const reason = error.message.trim() === '' ? '' : ` ${asSentence(error.message)}`;
      throw new Error(`No sea route leads from ${from.label} to ${to.label}.${reason}`, { cause: error });
    }
    throw error;
  }

  const passages = feature.properties.passages ?? [];
  return {
    from,
    to,
    distance: feature.properties.length,
    ecaFraction: feature.properties.ecaFraction ?? 0,
    transits: CANALS.filter((canal) => passages.includes(canal)),
    geometry: feature.geometry.coordinates as Coordinates[][],
  };
}

function directLeg(from: RoutePoint, to: RoutePoint): RouteLeg {
  return {
    from,
    to,
    distance: greatCircle(from, to),
    ecaFraction: [from, to].filter(inEca).length / 2,
    transits: [],
    geometry: [[coordinates(from), coordinates(to)]],
  };
}

function loadEngine(): Promise<Engine> {
  engine ??= Promise.all([import('searoute-ts'), import('searoute-ts/marnet-20km')]).catch((error: unknown) => {
    engine = null;
    throw error;
  });
  return engine;
}

function portPoint({ latitude, longitude, name, code }: Port): RoutePoint {
  return { latitude, longitude, label: name, code };
}

function coordinates({ longitude, latitude }: RoutePoint): Coordinates {
  return [longitude, latitude];
}
