import type { Burn } from '#features/bunkers/consumption.ts';
import { tankToWake } from '#features/bunkers/fuels.ts';
import { sumOf } from '#shared/collections.ts';
import type { FigureReader } from '#shared/figures.ts';
import type { EmissionRates } from './emissionRates.ts';

export function scopedEmissions(scoped: readonly Burn[]): number {
  return sumOf(scoped, ({ grade, quantity }) => quantity * tankToWake(grade));
}

export function euEtsCost(emissions: number, rate: FigureReader<EmissionRates>): number {
  return emissions === 0 ? 0 : Math.round(emissions * rate('allowancePrice') * rate('euroRate'));
}
