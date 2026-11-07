import type { Port } from '#features/ports/Port.ts';
import { PORTS } from '#features/ports/ports.data.ts';
import { mapValues, recordOf } from '#shared/collections.ts';
import type { FieldSpec } from '#shared/fields.ts';
import { greatCircle } from '#shared/geo.ts';
import { latestPrices } from './priceFeed.ts';
import { FUEL_GRADES, type FuelGrade } from './fuels.ts';

const BUNKER_HUBS = ['AEFJR', 'BRSSZ', 'NLRTM', 'SGSIN', 'USHOU', 'USLAX', 'USNYC'];
const FEED_ALIASES: Partial<Record<string, string>> = { AEFJR: 'AEFUJ' };

const FEED_GRADES: Record<FuelGrade, string> = {
  HFO: 'HFO_380',
  VLSFO: 'VLSFO',
  MGO: 'MGO_05S',
};

export type FuelPrices = Record<FuelGrade, number | null>;
export const NO_FUEL_PRICES: FuelPrices = recordOf(FUEL_GRADES, () => null);
export const BUNKER_PORTS = PORTS.filter(({ code }) => BUNKER_HUBS.includes(code));

export const FUEL_PRICE_FIELDS: readonly FieldSpec<FuelPrices>[] = FUEL_GRADES.map(
  (grade): FieldSpec<FuelPrices> => ({ kind: 'number', id: grade, label: `${grade} Price`, unit: '$/tonne', digits: 2, empty: 'zero' }),
);

export function nearestBunkerPort(port: Port | null): string {
  if (!port) return '';
  return BUNKER_PORTS.reduce((nearest, hub) => (greatCircle(port, hub) < greatCircle(port, nearest) ? hub : nearest)).code;
}

export async function fetchBunkerPrices(port: string): Promise<FuelPrices> {
  const hub = FEED_ALIASES[port] ?? port;
  const codes = mapValues(FEED_GRADES, (feed) => `${feed}_${hub}_USD`);
  return mapValues(codes, await latestPrices(Object.values(codes)));
}
