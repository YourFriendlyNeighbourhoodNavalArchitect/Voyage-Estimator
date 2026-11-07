import type { Port } from '#features/ports/Port.ts';
import type { VesselCandidate } from '#features/vessel/VesselCandidate.ts';
import { VESSEL_TYPES, type VesselType } from '#features/vessel/vessel.data.ts';
import { uniqueBy } from '#shared/collections.ts';
import { counted } from '#shared/format.ts';
import { fetchJson, HttpError } from '#shared/http.ts';
import type { SearchResult, SearchScope } from './vesselScreening.ts';

const PROXY = '/api/vessel';
const SCAN_RADIUS = 50;
const RETRY_LIMIT = 3;

interface ScanRow {
  uuid: string;
  imo: string | null;
  type_specific: string | null;
  lat: number;
  lon: number;
  speed: number | null;
  destination: string | null;
  distance: number;
}

interface InfoRow {
  name: string;
  country_name: string | null;
  deadweight: number | null;
  gross_tonnage: number | null;
  length: number | null;
  breadth: number | null;
  draught_max: number | null;
  year_built: string | null;
}

interface ScanHit {
  row: ScanRow;
  type: VesselType;
  imo: number;
}

export async function searchVessels({ loadPort, vesselTypes }: SearchScope, onProgress?: (message: string) => void): Promise<SearchResult> {
  const accepted = new Map(vesselTypes.flatMap((type) => VESSEL_TYPES[type].feedTypes.map((subtype) => [subtype, type] as const)));
  onProgress?.(`Scanning ${loadPort.name}.`);
  const scans = await Promise.all(prefixCover([...accepted.keys()]).map((subtype) => scanLocation(loadPort, subtype)));
  const sighted = uniqueBy(
    scans
      .flatMap((rows) => rows ?? [])
      .flatMap((row): ScanHit[] => {
        const type = accepted.get(row.type_specific ?? '');
        return type ? [{ row, type, imo: Number(row.imo) }] : [];
      }),
    ({ row, imo }) => (imo > 0 ? imo : row.uuid),
  );
  const identified = sighted.filter(({ imo }) => imo > 0);

  let done = 0;
  const details = await Promise.all(
    identified.map(async ({ row }) => {
      const info = await fetchParticulars(row.uuid);
      done += 1;
      onProgress?.(`Analysing ${counted(done, 'ship')}.`);
      return info;
    }),
  );
  const candidates = identified
    .map((sighting, index) => toCandidate(sighting, details[index]))
    .filter((candidate) => candidate !== null)
    .sort((first, second) => first.sighting.distance - second.sighting.distance);

  const lookupFailures = details.filter((info) => info === null).length;
  return {
    candidates,
    failures: scans.filter((rows) => rows === null).length + lookupFailures,
    missing: sighted.length - candidates.length - lookupFailures,
  };
}

function prefixCover(subtypes: readonly string[]): string[] {
  return subtypes.filter(
    (subtype) => !subtypes.some((other) => other !== subtype && subtype.startsWith(other)),
  );
}

async function scanLocation(port: Port, subtype: string): Promise<ScanRow[] | null> {
  const answer = await get<{ data: { vessels: ScanRow[] } }>('v0/vessel_inradius', {
    lat: port.latitude,
    lon: port.longitude,
    radius: SCAN_RADIUS,
    type_specific: subtype,
  });
  return answer === null ? null : answer.data.vessels;
}

async function fetchParticulars(uuid: string): Promise<InfoRow | null> {
  const answer = await get<{ data: InfoRow }>('v0/vessel_info', { uuid });
  return answer === null ? null : answer.data;
}

async function get<T>(path: string, params: Record<string, string | number>): Promise<T | null> {
  const query = new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]));
  try {
    return await fetchJson<T>(`${PROXY}/${path}?${query}`, RETRY_LIMIT);
  } catch (error) {
    if (error instanceof HttpError) return null;
    throw error;
  }
}

function toCandidate({ row, type, imo }: ScanHit, info: InfoRow | null): VesselCandidate | null {
  if (info === null || info.deadweight === null || info.deadweight <= 0) return null;
  const builtYear = Number(info.year_built);
  return {
    particulars: {
      imo,
      name: info.name,
      type,
      flag: info.country_name ?? '',
      deadweight: info.deadweight,
      grossTonnage: info.gross_tonnage,
      lengthOverall: info.length,
      beam: info.breadth,
      maxDraft: info.draught_max,
      builtYear: Number.isInteger(builtYear) && builtYear > 0 ? builtYear : null,
    },
    sighting: {
      latitude: row.lat,
      longitude: row.lon,
      speed: row.speed,
      destination: row.destination?.trim() ?? '',
      distance: row.distance,
    },
  };
}
