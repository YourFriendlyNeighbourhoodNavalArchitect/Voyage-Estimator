import { latestPrices } from '#features/bunkers/priceFeed.ts';
import { mapValues } from '#shared/collections.ts';

export interface EmissionRates {
  allowancePrice: number | null;
  euroRate: number | null;
}

const FEED_RATES: Record<keyof EmissionRates, string> = {
  allowancePrice: 'EU_CARBON_EUR',
  euroRate: 'EUR_USD',
};

export const NO_EMISSION_RATES: EmissionRates = { allowancePrice: null, euroRate: null };

export const EMISSION_RATE_LABELS: Record<keyof EmissionRates, string> = {
  allowancePrice: 'EU Allowance Price',
  euroRate: 'Euro Rate',
};

export async function fetchEmissionRates(): Promise<EmissionRates> {
  return mapValues(FEED_RATES, await latestPrices(Object.values(FEED_RATES)));
}
